import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxMedianAggregatorAbi } from "../../lib/contracts";

function fmtUsd(v: bigint | undefined): string {
  if (v === undefined) return "—";
  return "$" + Number(formatUnits(v, 18)).toFixed(4);
}

export default function OracleConsensusPanel() {
  const { t } = useTranslation();
  const { data: sourcePrices } = useReadContract({
    address: SANDBOX.medianAggregator,
    abi: CCMSandboxMedianAggregatorAbi,
    functionName: "sourcePrices",
    query: { refetchInterval: 10000 },
  });
  const { data: median } = useReadContract({
    address: SANDBOX.medianAggregator,
    abi: CCMSandboxMedianAggregatorAbi,
    functionName: "getPrice",
    query: { refetchInterval: 10000 },
  });

  const labels = ["Oracle-A", "Oracle-B", "Oracle-C", "Oracle-D (primary)"];
  const prices = (sourcePrices as readonly bigint[] | undefined) ?? [undefined, undefined, undefined, undefined];

  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
        {t("oracle.title")}
      </div>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: 720 }}>
        {t("oracle.subtitle")}
      </p>
      <div className="r-oracle">
        {labels.map((label, i) => (
          <div key={label} style={{ background: "var(--paper-deep)", padding: "20px 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
              {t("oracle.source")} {label}
            </div>
            <div style={{ fontSize: 24, fontFamily: "Space Grotesk, system-ui, sans-serif", fontWeight: 500, letterSpacing: "-0.01em", marginTop: 6 }}>
              {fmtUsd(prices[i] as bigint | undefined)}
            </div>
          </div>
        ))}
        <div style={{ background: "var(--paper-deep)", padding: "20px 20px", borderLeft: "2px solid var(--moss)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--moss)" }}>
            {t("oracle.median")}
          </div>
          <div style={{ fontSize: 32, fontFamily: "Space Grotesk, system-ui, sans-serif", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--moss)", marginTop: 6 }}>
            {fmtUsd(median as bigint | undefined)}
          </div>
        </div>
      </div>
    </section>
  );
}
