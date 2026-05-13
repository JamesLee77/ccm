import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxStakingAbi } from "../../lib/contracts";
import { useCumulativeMinted } from "../../lib/onchain";

function formatCcm(v: bigint | undefined): string {
  if (v === undefined) return "—";
  const n = Number(formatUnits(v, 18));
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRate(bps: bigint | undefined): string {
  if (bps === undefined) return "—";
  return (Number(bps) / 100).toFixed(2) + "%";
}

export default function HeroBanner() {
  const { t } = useTranslation();
  const cumulative = useCumulativeMinted();
  const { data: totalStaked } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "totalStaked",
    query: { refetchInterval: 10000 },
  });
  const { data: rateBps } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "currentYieldRateBps",
    query: { refetchInterval: 5000 },
  });

  return (
    <section style={{ marginTop: 24, marginBottom: 64, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "start" }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 24 }}>
          {t("hero.kicker")}
        </div>
        <h1 style={{ fontSize: 64, lineHeight: 1.0, margin: 0, fontWeight: 500, letterSpacing: "-0.02em" }}>
          {t("hero.headline")}<br />
          <span style={{ color: "var(--moss)" }}>{t("hero.headlineAccent")}</span>
        </h1>
        <p style={{ marginTop: 32, color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
          {t("hero.lead")}
        </p>
      </div>
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)", padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
          {t("hero.liveReadout")}
        </div>
        <div style={{ fontSize: 48, lineHeight: 1, fontFamily: "JetBrains Mono, ui-monospace, monospace", letterSpacing: "-0.02em" }}>
          {formatRate(rateBps as bigint | undefined)}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
          {t("hero.rate")} {t("hero.ratePerMonth")}
        </div>
        <div style={{ height: 1, background: "var(--rule)", margin: "20px 0" }} />
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
          {t("hero.cumulative")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 26, fontFamily: "JetBrains Mono, ui-monospace, monospace", letterSpacing: "-0.01em" }}>
              {formatCcm(cumulative.data)}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 2 }}>
              {t("hero.minted")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontFamily: "JetBrains Mono, ui-monospace, monospace", letterSpacing: "-0.01em", color: "var(--moss)" }}>
              {formatCcm(totalStaked as bigint | undefined)}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 2 }}>
              {t("hero.retired")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
