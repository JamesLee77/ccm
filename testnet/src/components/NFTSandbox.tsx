import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { keccak256, toBytes } from "viem";
import {
  CONTRACTS,
  CCMSandboxNFTAbi,
  GRADE_LABELS,
  GRADE_DESCRIPTIONS,
} from "../lib/contracts";

const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const COOLDOWN_LABEL = "1h cooldown";

type Holding = {
  id: bigint;
  grade: number;
  vintage: number;
  tonnage: bigint;
  balance: bigint;
  projectId: `0x${string}`;
};

function fmtSeconds(s: number): string {
  if (s <= 0) return "ready";
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

export default function NFTSandbox() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // ---- Mint form ----
  const [grade, setGrade] = useState(0);
  const [vintage, setVintage] = useState(2026);
  const [tonnage, setTonnage] = useState(50);
  const [projectName, setProjectName] = useState("demo:GS-2026-001");

  const projectId = useMemo(
    () => keccak256(toBytes(`project:${projectName}`)),
    [projectName],
  );

  // ---- Cooldown ----
  const { data: cooldownRem, refetch: refetchCooldown } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ---- nextId (so we can fetch newly-minted ids) ----
  const { data: nextId, refetch: refetchNextId } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "nextId",
    query: { refetchInterval: 10000 },
  });

  // ---- Holdings: scan ids 0..nextId, keep ones with balance > 0 ----
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [scanning, setScanning] = useState(false);

  async function refreshHoldings() {
    if (!address || !publicClient || nextId === undefined) return;
    const total = Number(nextId);
    if (total === 0) {
      setHoldings([]);
      return;
    }
    setScanning(true);
    try {
      const ids = Array.from({ length: total }, (_, i) => BigInt(i));
      // Multicall via batched read
      const balances = await Promise.all(
        ids.map((id) =>
          publicClient.readContract({
            address: NFT,
            abi: CCMSandboxNFTAbi,
            functionName: "balanceOf",
            args: [address, id],
          }),
        ),
      );
      const owned = ids.filter((_, i) => balances[i] > 0n);
      const metas = await Promise.all(
        owned.map((id) =>
          publicClient.readContract({
            address: NFT,
            abi: CCMSandboxNFTAbi,
            functionName: "meta",
            args: [id],
          }),
        ),
      );
      setHoldings(
        owned.map((id, i) => {
          const m = metas[i] as readonly [number, number, bigint, `0x${string}`, string, bigint];
          return {
            id,
            grade: m[0],
            vintage: m[1],
            tonnage: m[2],
            projectId: m[3],
            balance: balances[ids.indexOf(id)],
          };
        }),
      );
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    void refreshHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nextId]);

  // ---- Write hooks ----
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      refetchCooldown();
      refetchNextId();
      void refreshHoldings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const remaining = cooldownRem !== undefined ? Number(cooldownRem) : 0;
  const canMint = isConnected && remaining === 0 && !isPending && !isMining;
  const busy = isPending || isMining;

  function onMint() {
    if (!canMint) return;
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "mint",
      args: [grade, vintage, BigInt(tonnage), projectId],
    });
  }

  function onRetire(id: bigint, amount: bigint) {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "retire",
      args: [id, amount],
    });
  }

  return (
    <section className="space-y-6">
      {/* Mint form */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.1 · Mint a sandbox CCM-NFT
        </h2>
        <p
          className="mb-6 max-w-[640px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Issue a representative carbon credit NFT to your wallet. Choose grade
          (A–D), vintage, tonnage, and a project tag. Mainnet issuance is gated
          by VVB consensus; sandbox is open. {COOLDOWN_LABEL} per address.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Grade">
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            >
              {GRADE_LABELS.map((label, i) => (
                <option key={label} value={i} style={{ background: "var(--tn-bg)" }}>
                  Grade {label} — {GRADE_DESCRIPTIONS[i]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vintage (year)">
            <input
              type="number"
              min={2020}
              max={2030}
              value={vintage}
              onChange={(e) => setVintage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage (1–1,000 tCO₂e)">
            <input
              type="number"
              min={1}
              max={1000}
              value={tonnage}
              onChange={(e) => setTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Project tag (free text)">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. demo:DAC-2026-001"
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <button
          type="button"
          disabled={!canMint}
          onClick={onMint}
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-6 py-3"
          style={{
            background: canMint ? "var(--tn-amber)" : "rgba(245,158,11,0.18)",
            color: canMint ? "#000" : "var(--tn-text-soft)",
            border: `1px solid var(--tn-amber)`,
            cursor: canMint ? "pointer" : "not-allowed",
            minWidth: 220,
            textAlign: "center",
          }}
        >
          {!isConnected
            ? "Connect wallet first"
            : busy
            ? "Minting…"
            : remaining === 0
            ? "Mint NFT →"
            : `Cooldown · ${fmtSeconds(remaining)}`}
        </button>
        {error ? (
          <p className="mt-3 font-mono text-[12px]" style={{ color: "#ef4444" }}>
            {error.message.slice(0, 160)}
          </p>
        ) : null}
      </div>

      {/* Holdings + Retire */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-mono text-[11px] tracking-[0.16em] uppercase"
            style={{ color: "var(--tn-amber-text)" }}
          >
            §&nbsp;7.7 · Your sandbox NFT holdings · Retire (burn)
          </h2>
          <button
            type="button"
            onClick={() => void refreshHoldings()}
            className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1 border"
            style={{ borderColor: "var(--tn-border)", color: "var(--tn-text-soft)" }}
          >
            {scanning ? "scanning…" : "refresh"}
          </button>
        </div>
        {!isConnected ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            Connect a wallet to view holdings.
          </p>
        ) : holdings.length === 0 ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            No NFT holdings yet. Mint above to create your first batch.
          </p>
        ) : (
          <ul className="grid gap-3">
            {holdings.map((h) => (
              <HoldingRow key={h.id.toString()} h={h} onRetire={onRetire} />
            ))}
          </ul>
        )}
      </div>
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

function HoldingRow({
  h,
  onRetire,
}: {
  h: Holding;
  onRetire: (id: bigint, amount: bigint) => void;
}) {
  const [amount, setAmount] = useState<number>(Number(h.balance));
  return (
    <li
      className="border px-4 py-3 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
      style={{ borderColor: "var(--tn-border)", background: "rgba(0,0,0,0.3)" }}
    >
      <div
        className="font-mono text-[11px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-amber-text)" }}
      >
        #{h.id.toString()}
      </div>
      <div>
        <div className="font-mono text-[12px]">
          Grade {GRADE_LABELS[h.grade]} · vintage {h.vintage}
        </div>
        <div
          className="font-mono text-[10px] mt-1 truncate"
          style={{ color: "var(--tn-text-soft)" }}
          title={h.projectId}
        >
          {h.projectId.slice(0, 18)}…
        </div>
      </div>
      <div className="text-right font-mono text-[13px] tabular-nums">
        {h.balance.toString()} <span style={{ color: "var(--tn-text-soft)" }}>tCO₂e</span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <input
          type="number"
          min={1}
          max={Number(h.balance)}
          value={amount}
          onChange={(e) =>
            setAmount(Math.max(1, Math.min(Number(h.balance), Number(e.target.value))))
          }
          className="w-20 bg-transparent border px-2 py-1 font-mono text-sm text-right"
          style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
        />
        <button
          type="button"
          onClick={() => onRetire(h.id, BigInt(amount))}
          className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1 border"
          style={{
            borderColor: "var(--tn-amber)",
            color: "var(--tn-amber-text)",
            cursor: "pointer",
          }}
        >
          Retire →
        </button>
      </div>
    </li>
  );
}
