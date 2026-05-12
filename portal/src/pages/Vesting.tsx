import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, CCMVestingAbi } from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import { Card, CTA, H1, H3, Lede, SectionLabel } from "../components/site/primitives";

const vest = CONTRACTS.ccmVesting;

interface ScheduleData {
  id: bigint;
  beneficiary: string;
  totalAmount: bigint;
  startTime: bigint;
  cliffDuration: bigint;
  vestingDuration: bigint;
  released: bigint;
  revocable: boolean;
  revoked: boolean;
  releasable: bigint;
}

export default function Vesting() {
  const { t } = useTranslation(["vesting", "common"]);
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) setReloadTick((t) => t + 1);
  }, [isConfirmed]);

  useEffect(() => {
    if (!isConnected || !address || !client) return;
    setLoading(true);
    (async () => {
      try {
        const ids: bigint[] = [];
        for (let i = 0n; i < 50n; i++) {
          try {
            const id = (await client.readContract({
              address: vest, abi: CCMVestingAbi, functionName: "scheduleIdsOf", args: [address, i],
            })) as bigint;
            ids.push(id);
          } catch { break; }
        }
        const out: ScheduleData[] = [];
        for (const id of ids) {
          const s = (await client.readContract({
            address: vest, abi: CCMVestingAbi, functionName: "schedules", args: [id],
          })) as readonly [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
          const r = (await client.readContract({
            address: vest, abi: CCMVestingAbi, functionName: "releasable", args: [id],
          })) as bigint;
          out.push({
            id, beneficiary: s[0], totalAmount: s[1], startTime: s[2],
            cliffDuration: s[3], vestingDuration: s[4], released: s[5],
            revocable: s[6], revoked: s[7], releasable: r,
          });
        }
        setSchedules(out);
      } finally { setLoading(false); }
    })();
  }, [address, client, isConnected, reloadTick]);

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p style={{ color: "var(--ink-soft)" }}>Connect your wallet to see your vesting schedules.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Vesting</SectionLabel>
        <H1>{t("vesting:title")}</H1>
        <Lede className="mt-5">{t("vesting:subtitle")}</Lede>
      </header>

      {loading && (
        <p className="font-mono text-sm" style={{ color: "var(--ink-soft)" }}>Loading…</p>
      )}
      {!loading && schedules.length === 0 && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>{t("vesting:noSchedules")}</p>
        </Card>
      )}

      <div className="space-y-4">
        {schedules.map((s) => {
          const start = new Date(Number(s.startTime) * 1000);
          const cliffEnd = new Date(Number(s.startTime + s.cliffDuration) * 1000);
          const end = new Date(Number(s.startTime + s.vestingDuration) * 1000);
          const pct = s.totalAmount > 0n ? Number((s.released * 10000n) / s.totalAmount) / 100 : 0;
          const canRelease = s.releasable > 0n && !s.revoked;

          return (
            <Card key={s.id.toString()}>
              <div className="flex items-center justify-between mb-4">
                <H3>Schedule #{s.id.toString()}</H3>
                <div className="flex gap-2">
                  {s.revocable && (
                    <Tag color="clay">revocable</Tag>
                  )}
                  {s.revoked && (
                    <Tag color="red">revoked</Tag>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <div className="h-1.5 w-full" style={{ background: "var(--rule)" }}>
                  <div
                    className="h-1.5"
                    style={{ width: `${pct.toFixed(1)}%`, background: "var(--moss)" }}
                    aria-label="vest progress"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mb-5">
                <Field label={t("vesting:fields.total")} value={`${fmtCCM(s.totalAmount)} CCM`} />
                <Field label={t("vesting:fields.released")} value={`${fmtCCM(s.released)} CCM (${pct.toFixed(1)}%)`} />
                <Field label={t("vesting:fields.releasable")} value={`${fmtCCM(s.releasable)} CCM`} accent />
                <Field label={t("vesting:fields.start")} value={start.toLocaleString()} />
                <Field label={t("vesting:fields.cliffEnds")} value={cliffEnd.toLocaleString()} />
                <Field label={t("vesting:fields.fullyVested")} value={end.toLocaleString()} />
              </div>

              <CTA
                label={
                  isPending
                    ? t("vesting:awaitingWallet")
                    : isConfirming
                      ? t("vesting:confirming")
                      : t("vesting:release", { amount: fmtCCM(s.releasable) })
                }
                disabled={!canRelease || isPending || isConfirming}
                onClick={() =>
                  writeContract({
                    address: vest,
                    abi: CCMVestingAbi,
                    functionName: "release",
                    args: [s.id],
                  })
                }
              />
            </Card>
          );
        })}
      </div>

      {writeError && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}
        >
          {writeError.message}
        </div>
      )}
      {isConfirmed && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(45,191,99,0.08)", borderColor: "var(--moss)", color: "var(--moss)" }}
        >
          {t("vesting:released")}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </div>
      <div
        className="font-mono mt-1"
        style={{
          fontSize: 13,
          color: accent ? "var(--moss)" : "var(--ink)",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Tag({ color, children }: { color: "clay" | "red"; children: React.ReactNode }) {
  const styles = color === "clay"
    ? { bg: "rgba(200,96,46,0.08)", fg: "var(--clay)", border: "var(--clay)" }
    : { bg: "rgba(239,68,68,0.08)", fg: "#ef4444", border: "#ef4444" };
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{ background: styles.bg, color: styles.fg, borderColor: styles.border }}
    >
      {children}
    </span>
  );
}
