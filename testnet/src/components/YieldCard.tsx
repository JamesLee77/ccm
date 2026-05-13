import { useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMSandboxNFTAbi,
  CCMSandboxYieldAbi,
  GRADE_LABELS,
} from "../lib/contracts";

const YIELD = CONTRACTS.baseSepolia.ccmSandboxYield;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const E18 = 10n ** 18n;

const fmtCCM = (raw: bigint | undefined): string => {
  if (raw === undefined) return "—";
  const whole = raw / E18;
  const frac = ((raw % E18) * 10000n) / E18;
  return `${whole.toString()}.${frac.toString().padStart(4, "0")}`;
};

type StakeRow = {
  id: number;
  nftId: bigint;
  tonnage: bigint;
  grade: number;
  startedAt: bigint;
  active: boolean;
  pending: bigint;
};

const GRADE_MULTIPLIER: Record<number, string> = {
  0: "×4.0",
  1: "×2.0",
  2: "×1.0",
  3: "×0.5",
};

export default function YieldCard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [stakeId, setStakeId] = useState("0");
  const [stakeTonnage, setStakeTonnage] = useState(5);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Tick the wallclock so pendingReward UI updates without re-fetching every second.
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: nftApproved, refetch: refetchApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, YIELD] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: totalStaked } = useReadContract({
    address: YIELD,
    abi: CCMSandboxYieldAbi,
    functionName: "totalStaked",
    query: { refetchInterval: 8000 },
  });
  const { data: totalEarned } = useReadContract({
    address: YIELD,
    abi: CCMSandboxYieldAbi,
    functionName: "totalEarned",
    query: { refetchInterval: 8000 },
  });

  const { data: userStakeIds, refetch: refetchUserStakes } = useReadContract({
    address: YIELD,
    abi: CCMSandboxYieldAbi,
    functionName: "userStakesOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const [stakeRows, setStakeRows] = useState<StakeRow[]>([]);

  async function refreshStakes() {
    if (!publicClient || !userStakeIds) return;
    const ids = userStakeIds as readonly bigint[];
    const rows: StakeRow[] = await Promise.all(
      ids.map(async (id) => {
        const [s, pending] = await Promise.all([
          publicClient.readContract({
            address: YIELD,
            abi: CCMSandboxYieldAbi,
            functionName: "stakes",
            args: [id],
          }),
          publicClient.readContract({
            address: YIELD,
            abi: CCMSandboxYieldAbi,
            functionName: "pendingReward",
            args: [id],
          }),
        ]);
        const stake = s as readonly [string, bigint, bigint, number, bigint, bigint, boolean];
        return {
          id: Number(id),
          nftId: stake[1],
          tonnage: stake[2],
          grade: stake[3],
          startedAt: stake[4],
          active: stake[6],
          pending: pending as bigint,
        };
      }),
    );
    setStakeRows(rows);
  }

  useEffect(() => {
    void refreshStakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStakeIds, address, now]); // refresh pending preview every second on `now` tick

  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchApproval();
      refetchUserStakes();
      void refreshStakes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [YIELD, true],
    });
  }
  function doStake() {
    writeContract({
      address: YIELD,
      abi: CCMSandboxYieldAbi,
      functionName: "stake",
      args: [BigInt(stakeId), BigInt(stakeTonnage)],
    });
  }
  function doClaim(id: number) {
    writeContract({
      address: YIELD,
      abi: CCMSandboxYieldAbi,
      functionName: "claim",
      args: [BigInt(id)],
    });
  }
  function doUnstake(id: number) {
    writeContract({
      address: YIELD,
      abi: CCMSandboxYieldAbi,
      functionName: "unstake",
      args: [BigInt(id)],
    });
  }

  return (
    <section className="space-y-6">
      {/* Header + global stats + per-grade rates */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.6 · Hold-to-Earn · stake NFT, earn $CCM by grade weight
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Hold-to-Earn yield. Stake a CCM-NFT batch into the vault and earn
          $CCM proportional to grade weight (A=4×, B=2×, C=1×, D=0.5×) and
          time held. Capital-efficient ESG positioning without retirement —
          unstake any time to reclaim the NFT plus accrued yield.
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-5"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => (
            <div key={label} style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
              <div
                className="font-mono text-[10px] tracking-[0.14em] uppercase"
                style={{ color: "var(--tn-text-soft)" }}
              >
                Grade {label}
              </div>
              <div className="font-display mt-1" style={{ fontSize: 22, fontWeight: 400 }}>
                {GRADE_MULTIPLIER[g]}
              </div>
              <div
                className="font-mono text-[10px] mt-1"
                style={{ color: "var(--tn-amber-text)" }}
              >
                {g === 0
                  ? "DAC, 1000+ yr"
                  : g === 1
                  ? "biochar, 100+"
                  : g === 2
                  ? "reforest, 40+"
                  : "REDD+, 10–40"}
              </div>
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-2 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          <Pill label="Total tonnes staked" value={(totalStaked ?? 0n).toString()} />
          <Pill
            label="Total $CCM emitted"
            value={`${fmtCCM(totalEarned as bigint | undefined)} CCM`}
          />
        </div>
      </div>

      {/* Stake form */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Stake NFT → start earning yield
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={stakeId}
              onChange={(e) => setStakeId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to stake">
            <input
              type="number"
              min={1}
              value={stakeTonnage}
              onChange={(e) => setStakeTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {!nftApproved ? (
            <CTA
              label={busy ? "Approving…" : "1. Approve NFT to yield vault"}
              onClick={approveNFT}
              disabled={!isConnected || busy}
            />
          ) : (
            <span
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-2"
              style={{ color: "var(--tn-amber-text)" }}
            >
              ✓ NFT approved
            </span>
          )}
          <CTA
            label={busy ? "Staking…" : `2. Stake ${stakeTonnage} t`}
            onClick={doStake}
            disabled={!isConnected || !nftApproved || busy || stakeTonnage < 1}
          />
        </div>
      </div>

      {/* Stakes list */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Your stakes · pendingReward updates live
        </h3>
        {!isConnected ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            Connect a wallet to view stakes.
          </p>
        ) : stakeRows.length === 0 ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            No stakes yet. Stake an NFT above to start earning.
          </p>
        ) : (
          <ul className="grid gap-3">
            {stakeRows.map((s) => (
              <li
                key={s.id}
                className="border px-4 py-3 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
                style={{ borderColor: "var(--tn-border)", background: "rgba(0,0,0,0.3)" }}
              >
                <div
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-amber-text)" }}
                >
                  #{s.id}
                </div>
                <div>
                  <div className="font-mono text-[12px]">
                    NFT #{s.nftId.toString()} · Grade {GRADE_LABELS[s.grade]}{" "}
                    <span style={{ color: "var(--tn-text-soft)" }}>{GRADE_MULTIPLIER[s.grade]}</span>{" "}
                    · {s.tonnage.toString()} t
                  </div>
                  <div
                    className="font-mono text-[10px] mt-1"
                    style={{ color: "var(--tn-text-soft)" }}
                  >
                    started{" "}
                    {new Date(Number(s.startedAt) * 1000).toISOString().split("T")[0]} ·{" "}
                    {s.active ? "active" : "closed"}
                  </div>
                </div>
                <div className="text-right font-mono text-[13px] tabular-nums">
                  {fmtCCM(s.pending)} <span style={{ color: "var(--tn-text-soft)" }}>CCM</span>
                </div>
                <div className="flex gap-2 justify-end">
                  {s.active ? (
                    <>
                      <button
                        type="button"
                        onClick={() => doClaim(s.id)}
                        disabled={busy || s.pending === 0n}
                        className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border"
                        style={{
                          borderColor: "var(--tn-amber)",
                          color: "var(--tn-amber-text)",
                          cursor: busy || s.pending === 0n ? "not-allowed" : "pointer",
                          opacity: s.pending === 0n ? 0.5 : 1,
                        }}
                      >
                        Claim
                      </button>
                      <button
                        type="button"
                        onClick={() => doUnstake(s.id)}
                        disabled={busy}
                        className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border"
                        style={{
                          borderColor: "var(--tn-border)",
                          color: "var(--tn-text-soft)",
                          cursor: busy ? "wait" : "pointer",
                        }}
                      >
                        Unstake
                      </button>
                    </>
                  ) : (
                    <span
                      className="font-mono text-[10px] tracking-[0.14em] uppercase"
                      style={{ color: "var(--tn-text-soft)" }}
                    >
                      Closed
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="font-mono text-[12px]" style={{ color: "#ef4444" }}>
          {error.message.slice(0, 220)}
        </p>
      ) : null}
      {isSuccess ? (
        <p className="font-mono text-[12px]" style={{ color: "var(--tn-amber-text)" }}>
          ✓ Transaction confirmed.
        </p>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function CTA({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-[11px] tracking-[0.14em] uppercase px-4 py-2.5 transition-colors"
      style={{
        background: disabled ? "rgba(245,158,11,0.12)" : "var(--tn-amber)",
        color: disabled ? "var(--tn-text-soft)" : "#000",
        border: "1px solid var(--tn-amber)",
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 220,
      }}
    >
      {label}
    </button>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      <div className="font-display mt-1" style={{ fontSize: 18, fontWeight: 400 }}>
        {value}
      </div>
    </div>
  );
}
