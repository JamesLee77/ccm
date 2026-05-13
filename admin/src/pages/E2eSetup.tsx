import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { privateKeyToAccount } from "viem/accounts";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { IS_MAINNET } from "../lib/env";
import {
  Card,
  CTA,
  H1,
  H2,
  Lede,
  SectionLabel,
} from "../components/site/primitives";
import {
  TEST_CONNECTOR_ID,
  clearE2eKey,
  readE2eKey,
  saveE2eKey,
} from "../e2e/testConnector";

/**
 * Test-wallet setup page (testnet only).
 *
 * Two flows:
 *   • manual paste — user types a private key into a textarea
 *   • auto via URL — Playwright/Claude-in-Chrome navigate to
 *       /e2e?key=0x<priv>
 *     and the key is activated immediately without further interaction
 *
 * On activation, the key is saved to sessionStorage. We then trigger a
 * full page reload — wagmi config reads the key during initialization,
 * so reload is the cleanest way to register the test connector.
 *
 * MAINNET: this route is disabled at build time. The component below
 * also re-checks IS_MAINNET as a runtime guard.
 */
export default function E2eSetup() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [keyInput, setKeyInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  const existing = useMemo(() => readE2eKey(), []);
  const existingAddress = useMemo(() => {
    if (!existing) return null;
    try {
      return privateKeyToAccount(existing).address;
    } catch {
      return null;
    }
  }, [existing]);

  // URL ?key= path — activate immediately
  useEffect(() => {
    const k = search.get("key");
    if (!k) return;
    if (!/^0x[0-9a-fA-F]{64}$/.test(k)) {
      setError("URL key parameter is not a valid 0x-prefixed 32-byte hex string");
      return;
    }
    saveE2eKey(k as `0x${string}`);
    // Force reload so wagmi reinitializes with the test connector
    window.location.replace("/");
  }, [search]);

  if (IS_MAINNET) {
    return (
      <Card>
        <H2>Disabled on mainnet</H2>
        <p style={{ color: "var(--ink-soft)" }}>
          The e2e test wallet is not available on production. This page is
          a no-op on the mainnet build.
        </p>
      </Card>
    );
  }

  function activate() {
    setError(null);
    const k = keyInput.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(k)) {
      setError("Private key must be a 0x-prefixed 32-byte hex string");
      return;
    }
    saveE2eKey(k as `0x${string}`);
    window.location.replace("/");
  }

  function deactivate() {
    clearE2eKey();
    if (address) disconnect();
    window.location.replace("/");
  }

  function connectExisting() {
    const c = connectors.find((c) => c.id === TEST_CONNECTOR_ID);
    if (!c) {
      setError("Test connector not registered. Reload the page after saving a key.");
      return;
    }
    connect({ connector: c });
    navigate("/");
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Browser e2e · testnet only</SectionLabel>
        <H1>Test wallet</H1>
        <Lede className="mt-5">
          Activates a wagmi connector backed by a local private key.
          No MetaMask popups — all signatures and transactions are produced
          in-browser using the embedded key. Used for Playwright /
          Claude-in-Chrome automation against admin-testnet.
        </Lede>
      </header>

      <div
        className="border px-5 py-4 flex items-start gap-4 flex-wrap"
        style={{ background: "rgba(200,96,46,0.10)", borderColor: "var(--clay)" }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 border shrink-0"
          style={{ borderColor: "var(--clay)", color: "var(--clay)", fontWeight: 600 }}
        >
          E2E only
        </span>
        <div style={{ color: "var(--ink)", fontSize: 13, lineHeight: 1.55 }}>
          The pasted key is stored in sessionStorage of this browser tab
          (not localStorage — it dies when the tab closes). Use only test
          wallets with no production value. The page is excluded entirely
          from the mainnet build.
        </div>
      </div>

      {existing && existingAddress && (
        <Card>
          <H2>Active test wallet</H2>
          <p className="mt-3" style={{ color: "var(--ink-soft)" }}>
            A test key is already saved in this tab.
          </p>
          <div className="font-mono text-[12px] mt-2" style={{ color: "var(--ink)" }}>
            {existingAddress}
            {address?.toLowerCase() === existingAddress.toLowerCase() ? (
              <span style={{ color: "var(--moss)", marginLeft: 12 }}>· connected</span>
            ) : (
              <span style={{ color: "var(--clay)", marginLeft: 12 }}>· saved (not connected)</span>
            )}
          </div>
          <div className="mt-5 flex gap-3 flex-wrap">
            {address?.toLowerCase() !== existingAddress.toLowerCase() && (
              <CTA label="Connect" onClick={connectExisting} />
            )}
            <CTA variant="ghost" label="Clear test wallet" onClick={deactivate} />
          </div>
        </Card>
      )}

      <Card>
        <H2>Activate by private key</H2>
        <p className="mt-3 mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
          Paste a 32-byte hex private key (with 0x prefix) of a testnet
          wallet. The page will reload and the test connector will be
          available — click "Connect Wallet" in the header and pick
          "CCM Test Wallet".
        </p>
        <textarea
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="0x000000000000000000000000000000000000000000000000000000000000beef"
          className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
          style={{
            borderColor: "var(--rule)",
            color: "var(--ink)",
            background: "var(--paper)",
            resize: "vertical",
          }}
        />
        {error && (
          <p className="mt-2 font-mono text-[11px]" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
        <div className="mt-5">
          <CTA label="Activate" onClick={activate} disabled={!keyInput.trim()} />
        </div>
      </Card>

      <Card>
        <H2>Browser automation (URL param)</H2>
        <p className="mt-3 mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
          For headless browser tests, navigate directly to:
        </p>
        <pre
          className="font-mono text-[11px] p-3 border overflow-x-auto"
          style={{ borderColor: "var(--rule)", background: "var(--paper-deep)", color: "var(--moss)" }}
        >{`https://admin-testnet.ccmnetwork.net/e2e?key=0x<private-key-hex>`}</pre>
        <p className="mt-3" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
          The page activates the key and redirects to <code>/</code> so the
          test wallet is connected when your test starts interacting with
          the operator pages. Combine with the persona switcher
          (localStorage <code>ccm-admin-persona-override</code>) to test
          all 4 persona modes.
        </p>
      </Card>
    </div>
  );
}
