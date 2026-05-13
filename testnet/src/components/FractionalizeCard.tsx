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
  CCMSandboxFractionalizerAbi,
  CCMFractionTokenAbi,
} from "../lib/contracts";

const FRAC = CONTRACTS.baseSepolia.ccmSandboxFractionalizer;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const E18 = 10n ** 18n;

const fmtFRAC = (raw: bigint | undefined): string =>
  raw === undefined ? "—" : (raw / E18).toString();

type Series = {
  nftId: bigint;
  tokenAddr: string;
  tokenName: string;
  tokenSymbol: string;
  lockedTonnage: bigint;
  fractionBalance: bigint;
  totalSupply: bigint;
};

export default function FractionalizeCard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [fracId, setFracId] = useState("0");
  const [fracTonnage, setFracTonnage] = useState(5);

  // ----- NFT approval -----
  const { data: nftApproved, refetch: refetchApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, FRAC] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ----- Global stats -----
  const { data: activeSeriesCount, refetch: refetchActive } = useReadContract({
    address: FRAC,
    abi: CCMSandboxFractionalizerAbi,
    functionName: "totalActiveSeries",
    query: { refetchInterval: 10000 },
  });

  // ----- Scan all NFT ids for active fraction series + caller balance -----
  const { data: nextNftId } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "nextId",
    query: { refetchInterval: 15000 },
  });

  const [series, setSeries] = useState<Series[]>([]);
  const [scanning, setScanning] = useState(false);

  async function refreshSeries() {
    if (!publicClient || nextNftId === undefined) return;
    const total = Number(nextNftId);
    if (total === 0) {
      setSeries([]);
      return;
    }
    setScanning(true);
    try {
      const ids = Array.from({ length: total }, (_, i) => BigInt(i));
      // Read locked tonnages for all ids in one batch
      const lockedResults = await Promise.all(
        ids.map((id) =>
          publicClient.readContract({
            address: FRAC,
            abi: CCMSandboxFractionalizerAbi,
            functionName: "lockedTonnage",
            args: [id],
          }),
        ),
      );
      const activeIds = ids.filter((_, i) => (lockedResults[i] as bigint) > 0n);
      if (activeIds.length === 0) {
        setSeries([]);
        return;
      }
      const tokenAddrs = await Promise.all(
        activeIds.map((id) =>
          publicClient.readContract({
            address: FRAC,
            abi: CCMSandboxFractionalizerAbi,
            functionName: "fractionToken",
            args: [id],
          }),
        ),
      );
      const rows: Series[] = await Promise.all(
        activeIds.map(async (id, idx) => {
          const tokAddr = tokenAddrs[idx] as `0x${string}`;
          const [name, symbol, totalSupply, fracBal] = await Promise.all([
            publicClient.readContract({
              address: tokAddr,
              abi: CCMFractionTokenAbi,
              functionName: "name",
            }),
            publicClient.readContract({
              address: tokAddr,
              abi: CCMFractionTokenAbi,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: tokAddr,
              abi: CCMFractionTokenAbi,
              functionName: "totalSupply",
            }),
            address
              ? publicClient.readContract({
                  address: tokAddr,
                  abi: CCMFractionTokenAbi,
                  functionName: "balanceOf",
                  args: [address],
                })
              : Promise.resolve(0n),
          ]);
          const lockedIdx = ids.findIndex((x) => x === id);
          return {
            nftId: id,
            tokenAddr: tokAddr,
            tokenName: name as string,
            tokenSymbol: symbol as string,
            lockedTonnage: lockedResults[lockedIdx] as bigint,
            fractionBalance: fracBal as bigint,
            totalSupply: totalSupply as bigint,
          };
        }),
      );
      setSeries(rows);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    void refreshSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nextNftId]);

  // ----- Writes -----
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchApproval();
      refetchActive();
      void refreshSeries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [FRAC, true],
    });
  }
  function doFractionalize() {
    writeContract({
      address: FRAC,
      abi: CCMSandboxFractionalizerAbi,
      functionName: "fractionalize",
      args: [BigInt(fracId), BigInt(fracTonnage)],
    });
  }
  function doReassemble(id: bigint) {
    writeContract({
      address: FRAC,
      abi: CCMSandboxFractionalizerAbi,
      functionName: "reassemble",
      args: [id],
    });
  }

  return (
    <section className="space-y-6">
      {/* Header + global stats */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.5 · Fractionalization · split NFT into ERC-20 shares
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Lock a CCM-NFT batch, mint a per-id ERC-20 fraction series. Each
          fraction equals 1 tCO₂e of the underlying batch. Fractions are
          freely transferable; reassembly requires reacquiring the full set
          and burning it back. The original batch's traceability is preserved
          on the underlying NFT.
        </p>
        <div
          className="font-mono text-[11px] tracking-[0.14em] uppercase"
          style={{ color: "var(--tn-text-soft)" }}
        >
          Active series: {activeSeriesCount?.toString() ?? "—"}
        </div>
      </div>

      {/* Fractionalize form */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Fractionalize NFT → mint FRAC{`{id}`} ERC-20
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={fracId}
              onChange={(e) => setFracId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to fractionalize">
            <input
              type="number"
              min={1}
              value={fracTonnage}
              onChange={(e) => setFracTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {!nftApproved ? (
            <CTA
              label={busy ? "Approving…" : "1. Approve NFT to fractionalizer"}
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
            label={busy ? "Fractionalizing…" : `2. Fractionalize ${fracTonnage} t → ${fracTonnage} FRAC${fracId}`}
            onClick={doFractionalize}
            disabled={!isConnected || !nftApproved || busy || fracTonnage < 1}
          />
        </div>
      </div>

      {/* Active series list */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-mono text-[11px] tracking-[0.16em] uppercase"
            style={{ color: "var(--tn-amber-text)" }}
          >
            Active fraction series · click to reassemble (need full set)
          </h3>
          <button
            type="button"
            onClick={() => void refreshSeries()}
            className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1 border"
            style={{ borderColor: "var(--tn-border)", color: "var(--tn-text-soft)" }}
          >
            {scanning ? "scanning…" : "refresh"}
          </button>
        </div>
        {series.length === 0 ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            No active series. Fractionalize an NFT above to start one.
          </p>
        ) : (
          <ul className="grid gap-3">
            {series.map((s) => {
              const holdsAll = s.fractionBalance >= s.totalSupply && s.totalSupply > 0n;
              return (
                <li
                  key={s.nftId.toString()}
                  className="border px-4 py-3 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
                  style={{ borderColor: "var(--tn-border)", background: "rgba(0,0,0,0.3)" }}
                >
                  <div
                    className="font-mono text-[11px] tracking-[0.14em] uppercase"
                    style={{ color: "var(--tn-amber-text)" }}
                  >
                    NFT #{s.nftId.toString()}
                  </div>
                  <div>
                    <div className="font-mono text-[12px]">
                      {s.tokenSymbol} · {s.tokenName}
                    </div>
                    <div
                      className="font-mono text-[10px] mt-1 truncate"
                      style={{ color: "var(--tn-text-soft)" }}
                      title={s.tokenAddr}
                    >
                      {s.tokenAddr.slice(0, 10)}…{s.tokenAddr.slice(-6)} · locked: {s.lockedTonnage.toString()} t
                    </div>
                  </div>
                  <div className="text-right font-mono text-[13px] tabular-nums">
                    you: {fmtFRAC(s.fractionBalance)} / {fmtFRAC(s.totalSupply)}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => doReassemble(s.nftId)}
                      disabled={!isConnected || !holdsAll || busy}
                      className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border"
                      style={{
                        borderColor: holdsAll ? "var(--tn-amber)" : "var(--tn-border)",
                        color: holdsAll ? "var(--tn-amber-text)" : "var(--tn-text-soft)",
                        cursor: holdsAll ? "pointer" : "not-allowed",
                      }}
                    >
                      Reassemble →
                    </button>
                  </div>
                </li>
              );
            })}
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
        minWidth: 240,
      }}
    >
      {label}
    </button>
  );
}
