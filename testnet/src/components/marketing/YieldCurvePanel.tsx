import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxStakingAbi, MockPriceOracleAbi } from "../../lib/contracts";

// Constants from CCMSandboxStaking — mirrored here so we can show
// decomposition without an extra view call.
const R0_BPS = 1000n;        // 10 % per month
const P0_TGE = 200000000000000000n; // 0.20 USD
const POOL_INIT = 5000000n * 10n ** 18n; // 5,000,000 CCM

function pct(x: bigint, scale: bigint = 1_000_000_000_000_000_000n): string {
  const ratio = Number(x) / Number(scale);
  return (ratio * 100).toFixed(2) + "%";
}

export default function YieldCurvePanel() {
  const { t } = useTranslation();
  const { data: rateBps } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "currentYieldRateBps",
    query: { refetchInterval: 5000 },
  });
  const { data: poolRem } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "poolRemaining",
    query: { refetchInterval: 10000 },
  });
  const { data: price } = useReadContract({
    address: SANDBOX.mockPriceOracle,
    abi: MockPriceOracleAbi,
    functionName: "getPrice",
    query: { refetchInterval: 10000 },
  });

  const poolFactor = poolRem !== undefined ? ((poolRem as bigint) * 10n ** 18n) / POOL_INIT : undefined;
  const priceFactor = price !== undefined && (price as bigint) > 0n
    ? (P0_TGE * 10n ** 18n) / (price as bigint)
    : undefined;
  const rateDisplay = rateBps !== undefined ? (Number(rateBps) / 100).toFixed(2) + "%" : "—";

  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
        {t("yieldCurve.title")}
      </div>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: 720 }}>
        {t("yieldCurve.subtitle")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 1, background: "var(--rule)", border: "1px solid var(--rule)" }}>
        <div style={{ background: "var(--paper-deep)", padding: "24px 28px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--moss)" }}>
            {t("yieldCurve.current")}
          </div>
          <div style={{ fontSize: 48, fontFamily: "JetBrains Mono, ui-monospace, monospace", letterSpacing: "-0.02em", color: "var(--moss)", marginTop: 8, lineHeight: 1 }}>
            {rateDisplay}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{t("yieldCurve.perMonth")}</div>
        </div>
        <div style={{ background: "var(--paper-deep)", padding: "24px 24px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            {t("yieldCurve.r0")}
          </div>
          <div style={{ fontSize: 22, fontFamily: "JetBrains Mono, ui-monospace, monospace", marginTop: 6 }}>
            {(Number(R0_BPS) / 100).toFixed(0)}%
          </div>
        </div>
        <div style={{ background: "var(--paper-deep)", padding: "24px 24px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            {t("yieldCurve.pool")}
          </div>
          <div style={{ fontSize: 22, fontFamily: "JetBrains Mono, ui-monospace, monospace", marginTop: 6 }}>
            {poolFactor !== undefined ? pct(poolFactor) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
            {poolRem !== undefined ? `${Number(formatUnits(poolRem as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })} CCM` : ""}
          </div>
        </div>
        <div style={{ background: "var(--paper-deep)", padding: "24px 24px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            {t("yieldCurve.price")}
          </div>
          <div style={{ fontSize: 22, fontFamily: "JetBrains Mono, ui-monospace, monospace", marginTop: 6 }}>
            {priceFactor !== undefined ? pct(priceFactor) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
            {price !== undefined ? `$${Number(formatUnits(price as bigint, 18)).toFixed(4)}` : ""}
          </div>
        </div>
      </div>
    </section>
  );
}
