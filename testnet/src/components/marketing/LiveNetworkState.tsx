import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxStakingAbi, CCMSandboxNodeRegistryAbi } from "../../lib/contracts";
import { useActiveMiners, useMintsRecent } from "../../lib/onchain";

function fmtNum(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString();
}
function fmtCcm(v: bigint | undefined): string {
  if (v === undefined) return "—";
  return Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function LiveNetworkState() {
  const { t } = useTranslation();
  const miners = useActiveMiners();
  const mints = useMintsRecent();
  const { data: nodeCount } = useReadContract({
    address: SANDBOX.nodeRegistry,
    abi: CCMSandboxNodeRegistryAbi,
    functionName: "count",
    query: { refetchInterval: 30000 },
  });
  const { data: totalStaked } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "totalStaked",
    query: { refetchInterval: 10000 },
  });
  const { data: poolRem } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "poolRemaining",
    query: { refetchInterval: 10000 },
  });

  const cells = [
    { id: "nodes", value: fmtNum(nodeCount ? Number(nodeCount) : undefined), label: t("live.nodes") },
    { id: "miners", value: fmtNum(miners.data), label: t("live.miners") },
    { id: "mints", value: fmtNum(mints.data), label: t("live.minted") },
    { id: "staked", value: fmtCcm(totalStaked as bigint | undefined), label: t("live.staked") },
    { id: "pool", value: fmtCcm(poolRem as bigint | undefined), label: t("live.poolRemaining") },
  ];

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block", animation: "lns-pulse 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)" }}>
          {t("live.title")}
        </span>
      </div>
      <div className="r-live5">
        {cells.map((c) => (
          <div key={c.id} style={{ background: "var(--paper-deep)", padding: "20px 24px" }}>
            <div style={{ fontSize: 28, fontFamily: "JetBrains Mono, ui-monospace, monospace", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", marginTop: 6 }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes lns-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }`}</style>
    </section>
  );
}
