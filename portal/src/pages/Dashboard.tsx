import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { CONTRACTS, CCMTokenAbi, CCMVestingAbi } from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import { Card, H1, SectionLabel } from "../components/site/primitives";

const v1 = CONTRACTS.ccmTokenV1;
const v2 = CONTRACTS.ccmTokenV2;
const vest = CONTRACTS.ccmVesting;

interface NextUnlock {
  scheduleId: bigint;
  unlockAt: bigint;
}

export default function Dashboard() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { address, isConnected } = useAccount();
  const client = usePublicClient();

  const { data: v1Bal } = useReadContract({
    address: v1, abi: CCMTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: v2Bal } = useReadContract({
    address: v2, abi: CCMTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const [totalClaimable, setTotalClaimable] = useState<bigint>(0n);
  const [nextUnlock, setNextUnlock] = useState<NextUnlock | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !client) return;
    void (async () => {
      const ids: bigint[] = [];
      for (let i = 0n; i < 50n; i++) {
        try {
          const id = (await client.readContract({
            address: vest, abi: CCMVestingAbi, functionName: "scheduleIdsOf", args: [address, i],
          })) as bigint;
          ids.push(id);
        } catch { break; }
      }
      let claimable = 0n;
      let next: NextUnlock | null = null;
      const now = BigInt(Math.floor(Date.now() / 1000));
      for (const id of ids) {
        const r = (await client.readContract({
          address: vest, abi: CCMVestingAbi, functionName: "releasable", args: [id],
        })) as bigint;
        claimable += r;

        const s = (await client.readContract({
          address: vest, abi: CCMVestingAbi, functionName: "schedules", args: [id],
        })) as readonly [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
        const cliffEnd = s[2] + s[3];
        if (cliffEnd > now && (!next || cliffEnd < next.unlockAt)) {
          next = { scheduleId: id, unlockAt: cliffEnd };
        }
      }
      setTotalClaimable(claimable);
      setNextUnlock(next);
    })();
  }, [address, client, isConnected]);

  const totalCcm = (v1Bal as bigint | undefined ?? 0n) + (v2Bal as bigint | undefined ?? 0n);

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Dashboard</SectionLabel>
        <H1>{t("dashboard:title")}</H1>
      </header>

      {!isConnected && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>{t("common:connect")}</p>
        </Card>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t("dashboard:cards.totalBalance")} value={fmtCCM(totalCcm)} suffix="CCM" />
          <StatCard
            title={t("dashboard:cards.nextUnlock")}
            value={nextUnlock ? new Date(Number(nextUnlock.unlockAt) * 1000).toLocaleDateString() : "—"}
            subtitle={nextUnlock ? `#${nextUnlock.scheduleId.toString()}` : t("dashboard:noNextUnlock")}
          />
          <StatCard
            title={t("dashboard:cards.claimable")}
            value={fmtCCM(totalClaimable)}
            suffix="CCM"
            highlight={totalClaimable > 0n}
          />
          <StatCard
            title={t("dashboard:cards.migration")}
            value={(v1Bal as bigint | undefined ?? 0n) > 0n ? "v1 → v2 ready" : "—"}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  suffix,
  highlight,
}: {
  title: string;
  value: string;
  subtitle?: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="border p-5"
      style={{
        background: highlight ? "rgba(45,191,99,0.08)" : "var(--paper-deep)",
        borderColor: highlight ? "var(--moss)" : "var(--rule)",
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: highlight ? "var(--moss)" : "var(--ink-soft)" }}
      >
        {title}
      </div>
      <div
        className="font-display mt-2"
        style={{
          fontSize: 26,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        {value}
        {suffix && (
          <span
            className="font-mono ml-1.5"
            style={{ fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.08em" }}
          >
            {suffix}
          </span>
        )}
      </div>
      {subtitle && (
        <div
          className="font-mono text-[10px] mt-2"
          style={{ color: "var(--ink-soft)" }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
