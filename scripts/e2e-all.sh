#!/usr/bin/env bash
# ============================================================================
# CCM Network — full e2e suite (data layer + browser layer)
#
# Runs in two phases:
#   1. onchain hardhat scripts — direct contract calls + portal-api JSON
#      assertions (fast, no browser)
#   2. admin Playwright suite — browser-driven UI flows against deployed
#      admin-testnet (persona model, SIWE, full vesting create flow)
#
# Defaults to running all of phase 1 (each takes 30-90 seconds) and the
# entire phase 2 suite. Override scope with env vars:
#   SKIP_ONCHAIN=1          → skip phase 1
#   SKIP_BROWSER=1          → skip phase 2
#   ONCHAIN_SUITES="kyc vesting compliance"
#                            → space-separated subset of phase 1 specs
#                              (default: kyc, vesting, compliance, manual-transfer)
#
# Reads COMPLIANCE_* and CAROL_ADDRESS from onchain/.env automatically.
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ONCHAIN_DIR="$REPO_ROOT/onchain"
ADMIN_DIR="$REPO_ROOT/admin"

bold()   { printf "\033[1m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
header() {
  echo
  printf "\033[1;36m━━━ %s ━━━\033[0m\n" "$*"
}

# ── Source onchain/.env so the hardhat scripts and Playwright env vars
#    can read the test wallets in one place.
if [[ ! -f "$ONCHAIN_DIR/.env" ]]; then
  red "missing $ONCHAIN_DIR/.env — required for test wallets"
  exit 1
fi
# shellcheck disable=SC2046
export $(grep -E '^(PRIVATE_KEY|COMPLIANCE_|ALICE_|BOB_|CAROL_)' "$ONCHAIN_DIR/.env" | xargs)

# ── Phase 1: data-layer ────────────────────────────────────────────────
ONCHAIN_FAILED=()
if [[ "${SKIP_ONCHAIN:-}" != "1" ]]; then
  header "Phase 1 · data-layer e2e (hardhat)"
  cd "$ONCHAIN_DIR"
  SUITES="${ONCHAIN_SUITES:-kyc vesting compliance manual-transfer}"
  for s in $SUITES; do
    case "$s" in
      kyc)              SCRIPT="scripts/_e2e-kyc-flow.ts" ;;
      vesting)          SCRIPT="scripts/_e2e-vesting-flow.ts" ;;
      compliance)       SCRIPT="scripts/_e2e-compliance-persona.ts" ;;
      timelock)         SCRIPT="scripts/_e2e-timelock-flow.ts" ;;
      manual-transfer)  SCRIPT="scripts/_e2e-manual-transfer.ts" ;;
      *)                red "unknown suite: $s"; exit 1 ;;
    esac
    bold "→ $s ($SCRIPT)"
    if npx hardhat run "$SCRIPT" --network baseSepolia; then
      green "  ✓ $s passed"
    else
      red   "  ✗ $s failed"
      ONCHAIN_FAILED+=("$s")
    fi
  done
fi

# ── Phase 2: browser layer ──────────────────────────────────────────────
BROWSER_RC=0
if [[ "${SKIP_BROWSER:-}" != "1" ]]; then
  header "Phase 2 · browser-layer e2e (Playwright)"
  cd "$ADMIN_DIR"

  if [[ -z "${COMPLIANCE_PRIVATE_KEY:-}" ]] || [[ -z "${COMPLIANCE_ADDRESS:-}" ]]; then
    red "COMPLIANCE_PRIVATE_KEY / COMPLIANCE_ADDRESS missing in onchain/.env"
    exit 1
  fi

  PLAYWRIGHT_TEST_KEY="$COMPLIANCE_PRIVATE_KEY" \
  PLAYWRIGHT_TEST_ADDR="$COMPLIANCE_ADDRESS" \
  PLAYWRIGHT_BENEFICIARY="$CAROL_ADDRESS" \
  npx playwright test || BROWSER_RC=$?
fi

# ── Summary ─────────────────────────────────────────────────────────────
header "Summary"
if (( ${#ONCHAIN_FAILED[@]} > 0 )); then
  red "Phase 1 failures: ${ONCHAIN_FAILED[*]}"
fi
if (( BROWSER_RC != 0 )); then
  red "Phase 2 exit code: $BROWSER_RC"
fi
if (( ${#ONCHAIN_FAILED[@]} == 0 )) && (( BROWSER_RC == 0 )); then
  green "✅ All e2e suites passed"
  exit 0
else
  red "❌ Some e2e suites failed"
  exit 1
fi
