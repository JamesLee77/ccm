import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMSandboxIndexBasketAbi,
  CCMBasketTokenAbi,
  CCMGradeTokenAbi,
  BASKET_KIND,
  BASKET_DESCRIPTIONS,
  GRADE_LABELS,
} from "../lib/contracts";

const BASKET = CONTRACTS.baseSepolia.ccmSandboxIndexBasket;
const BASKETS = [
  CONTRACTS.baseSepolia.basketTokens.PRIME,
  CONTRACTS.baseSepolia.basketTokens.FOREST,
  CONTRACTS.baseSepolia.basketTokens.TECH,
] as const;
const GRADES = [
  CONTRACTS.baseSepolia.gradeTokens.A,
  CONTRACTS.baseSepolia.gradeTokens.B,
  CONTRACTS.baseSepolia.gradeTokens.C,
  CONTRACTS.baseSepolia.gradeTokens.D,
] as const;

const E18 = 10n ** 18n;
const fmt = (raw: bigint | undefined): string => {
  if (raw === undefined) return "—";
  const whole = raw / E18;
  const frac = ((raw % E18) * 10000n) / E18;
  return `${whole.toString()}.${frac.toString().padStart(4, "0")}`;
};

export default function IndexBasketCard() {
  const { address, isConnected } = useAccount();
  const [activeBasket, setActiveBasket] = useState(0);
  const [mintAmount, setMintAmount] = useState(1);
  const [redeemAmount, setRedeemAmount] = useState(1);

  const basketAtomic = BigInt(mintAmount) * E18;
  const redeemAtomic = BigInt(redeemAmount) * E18;

  // Read weights for all 3 baskets
  const { data: weightsData } = useReadContracts({
    contracts: [0, 1, 2].map((i) => ({
      address: BASKET,
      abi: CCMSandboxIndexBasketAbi,
      functionName: "weightsOf",
      args: [i],
    })),
  });

  // Read user balances for the 3 baskets
  const { data: basketBalances, refetch: refetchBasketBalances } = useReadContracts({
    contracts: BASKETS.map((addr) => ({
      address: addr,
      abi: CCMBasketTokenAbi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    })),
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Read user balances for the 4 grade tokens
  const { data: gradeBalances, refetch: refetchGradeBalances } = useReadContracts({
    contracts: GRADES.map((addr) => ({
      address: addr,
      abi: CCMGradeTokenAbi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    })),
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Read user allowances for the 4 grade tokens to BASKET
  const { data: gradeAllowances, refetch: refetchAllowances } = useReadContracts({
    contracts: GRADES.map((addr) => ({
      address: addr,
      abi: [...CCMGradeTokenAbi, {
        type: "function",
        name: "allowance",
        inputs: [{ type: "address" }, { type: "address" }],
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
      }] as const,
      functionName: "allowance" as const,
      args: address ? [address, BASKET] : undefined,
    })),
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Quote mint for active basket
  const { data: mintQuote } = useReadContract({
    address: BASKET,
    abi: CCMSandboxIndexBasketAbi,
    functionName: "quoteMint",
    args: [activeBasket, basketAtomic],
    query: { refetchInterval: 5000 },
  });
  const { data: redeemQuote } = useReadContract({
    address: BASKET,
    abi: CCMSandboxIndexBasketAbi,
    functionName: "quoteRedeem",
    args: [activeBasket, redeemAtomic],
    query: { refetchInterval: 5000 },
  });

  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchAllowances();
      refetchBasketBalances();
      refetchGradeBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  const userBasketBals: bigint[] = [0, 1, 2].map(
    (i) => (basketBalances?.[i]?.result as bigint | undefined) ?? 0n,
  );
  const userGradeBals: bigint[] = [0, 1, 2, 3].map(
    (i) => (gradeBalances?.[i]?.result as bigint | undefined) ?? 0n,
  );
  const userAllowances: bigint[] = [0, 1, 2, 3].map(
    (i) => (gradeAllowances?.[i]?.result as bigint | undefined) ?? 0n,
  );
  const needs = (mintQuote as readonly bigint[] | undefined) ?? [0n, 0n, 0n, 0n];
  const gives = (redeemQuote as readonly bigint[] | undefined) ?? [0n, 0n, 0n, 0n];

  // Approval status per grade for current mint quote
  function approveGradeFor(gradeIdx: number, amount: bigint) {
    writeContract({
      address: GRADES[gradeIdx],
      abi: [...CCMGradeTokenAbi, {
        type: "function",
        name: "approve",
        inputs: [{ type: "address" }, { type: "uint256" }],
        outputs: [{ type: "bool" }],
        stateMutability: "nonpayable",
      }] as const,
      functionName: "approve" as const,
      args: [BASKET, amount],
    });
  }

  function doMint() {
    writeContract({
      address: BASKET,
      abi: CCMSandboxIndexBasketAbi,
      functionName: "mint",
      args: [activeBasket, basketAtomic],
    });
  }
  function doRedeem() {
    writeContract({
      address: BASKET,
      abi: CCMSandboxIndexBasketAbi,
      functionName: "redeem",
      args: [activeBasket, redeemAtomic],
    });
  }

  const allApproved = needs.every((n, i) => userAllowances[i] >= n);
  const enoughGrades = needs.every((n, i) => userGradeBals[i] >= n);

  return (
    <section className="space-y-6">
      {/* Header + 3 basket overview */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.8 · Index Baskets · ETF-style portfolios of grade tokens
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Three curated basket tokens that bundle exposure to multiple
          grade-specific $CCM tokens at fixed weights. Mint deposits the
          underlying grade tokens at the basket's weights and returns
          basket tokens; redeem reverses, returning the underlying
          pro-rata. The carbon-market analogue of a passive ETF.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => {
            const isActive = i === activeBasket;
            const w = weightsData?.[i]?.result as
              | readonly [number, number, number, number]
              | undefined;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveBasket(i)}
                className="border text-left p-4 transition-colors"
                style={{
                  background: isActive ? "rgba(245,158,11,0.08)" : "rgba(0,0,0,0.3)",
                  borderColor: isActive ? "var(--tn-amber)" : "var(--tn-border)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-amber-text)" }}
                >
                  $CCM-{BASKET_KIND[i]}
                </div>
                <div
                  className="font-mono text-[10px] mt-1"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  {BASKET_DESCRIPTIONS[i]}
                </div>
                <div className="font-mono text-[12px] mt-3" style={{ color: "var(--tn-text)" }}>
                  {w
                    ? GRADE_LABELS.map((g, idx) => `${g} ${Number(w[idx]) / 100}%`).join(" · ")
                    : "—"}
                </div>
                <div
                  className="font-mono text-[10px] mt-3"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  your balance:{" "}
                  <span style={{ color: "var(--tn-text)" }}>{fmt(userBasketBals[i])}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mint */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Mint $CCM-{BASKET_KIND[activeBasket]}
        </h3>
        <p
          className="mb-4 max-w-[640px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 13, lineHeight: 1.55 }}
        >
          Pre-requisite: hold grade tokens (use §7.3 to wrap your NFTs into
          $CCM-A/B/C/D first). The basket pulls each grade token in the
          target weight and mints {BASKET_KIND[activeBasket]} 1:1 with your
          input atom count.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end mb-5">
          <Field label={`Amount to mint (whole ${BASKET_KIND[activeBasket]})`}>
            <input
              type="number"
              min={1}
              value={mintAmount}
              onChange={(e) => setMintAmount(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <CTA
            label={busy ? "Minting…" : `Mint ${mintAmount} ${BASKET_KIND[activeBasket]}`}
            onClick={doMint}
            disabled={!isConnected || !allApproved || !enoughGrades || busy}
          />
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => {
            const need = needs[g] ?? 0n;
            const have = userGradeBals[g];
            const allow = userAllowances[g];
            const enough = have >= need;
            const approved = allow >= need;
            return (
              <div key={label} style={{ background: "var(--tn-surface)", padding: "12px 16px" }}>
                <div
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  $CCM-{label} · need {fmt(need)}
                </div>
                <div
                  className="font-mono text-[11px] mt-1"
                  style={{ color: enough ? "var(--tn-text)" : "#ef4444" }}
                >
                  have: {fmt(have)}
                </div>
                {need > 0n ? (
                  approved ? (
                    <div
                      className="font-mono text-[10px] mt-1"
                      style={{ color: "var(--tn-amber-text)" }}
                    >
                      ✓ approved
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || !isConnected}
                      onClick={() => approveGradeFor(g, need)}
                      className="font-mono text-[10px] tracking-[0.14em] uppercase mt-2 px-2 py-1 border w-full"
                      style={{
                        borderColor: "var(--tn-amber)",
                        color: "var(--tn-amber-text)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                  )
                ) : (
                  <div
                    className="font-mono text-[10px] mt-1"
                    style={{ color: "var(--tn-text-soft)" }}
                  >
                    (not used)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Redeem $CCM-{BASKET_KIND[activeBasket]} → grade tokens
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end mb-5">
          <Field label={`Amount to redeem (whole ${BASKET_KIND[activeBasket]})`}>
            <input
              type="number"
              min={1}
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <CTA
            label={busy ? "Redeeming…" : `Redeem ${redeemAmount} ${BASKET_KIND[activeBasket]}`}
            onClick={doRedeem}
            disabled={
              !isConnected ||
              busy ||
              userBasketBals[activeBasket] < redeemAtomic ||
              redeemAmount < 1
            }
          />
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => (
            <div key={label} style={{ background: "var(--tn-surface)", padding: "12px 16px" }}>
              <div
                className="font-mono text-[10px] tracking-[0.14em] uppercase"
                style={{ color: "var(--tn-text-soft)" }}
              >
                receive $CCM-{label}
              </div>
              <div
                className="font-mono text-[12px] mt-1"
                style={{ color: "var(--tn-text)" }}
              >
                {fmt(gives[g] ?? 0n)}
              </div>
            </div>
          ))}
        </div>
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
