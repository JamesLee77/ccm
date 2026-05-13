/**
 * Swap CCM ⇄ sUSDC via Uniswap V3 SwapRouter02 on Base Sepolia.
 * Quotes via Quoter v1 (simulateContract). Approve→swap flow.
 * Includes a faucet button for sUSDC (MockSandboxUSDC.faucet).
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  SANDBOX,
  POOL_FEE,
  CCMTokenAbi,
  MockSandboxUSDCAbi,
  SwapRouter02Abi,
  QuoterAbi,
} from "../../lib/contracts";
import { publicClient } from "../../lib/onchain";
import { pingActivityFeed } from "../../lib/activityBus";

const SLIPPAGE_BPS = 50; // 0.5%

type Direction = "ccm-to-usdc" | "usdc-to-ccm";

function fmt(v: bigint | undefined, decimals: number, max = 6): string {
  if (v === undefined) return "—";
  return Number(formatUnits(v, decimals)).toLocaleString(undefined, { maximumFractionDigits: max });
}

function fmtCooldown(secs: number): string {
  if (secs <= 0) return "0s";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function SwapForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [direction, setDirection] = useState<Direction>("ccm-to-usdc");
  const [amountInStr, setAmountInStr] = useState("");
  const [quoted, setQuoted] = useState<bigint | undefined>(undefined);
  const [quoting, setQuoting] = useState(false);

  const isCcmIn = direction === "ccm-to-usdc";
  const tokenIn = isCcmIn ? SANDBOX.ccmToken : SANDBOX.mockSandboxUSDC;
  const tokenOut = isCcmIn ? SANDBOX.mockSandboxUSDC : SANDBOX.ccmToken;
  const decIn = isCcmIn ? 18 : 6;
  const decOut = isCcmIn ? 6 : 18;
  const symIn = isCcmIn ? "CCM" : "sUSDC";
  const symOut = isCcmIn ? "sUSDC" : "CCM";

  // Balances
  const { data: ccmBal, refetch: refetchCcmBal } = useReadContract({
    address: SANDBOX.ccmToken, abi: CCMTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });
  const { data: usdcBal, refetch: refetchUsdcBal } = useReadContract({
    address: SANDBOX.mockSandboxUSDC, abi: MockSandboxUSDCAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // Allowance to SwapRouter02
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn,
    abi: isCcmIn ? CCMTokenAbi : MockSandboxUSDCAbi,
    functionName: "allowance",
    args: address ? [address, SANDBOX.uniV3SwapRouter02] : undefined,
    query: { enabled: !!address },
  });

  // Faucet cooldown
  const { data: faucetCdRaw, refetch: refetchFaucetCd } = useReadContract({
    address: SANDBOX.mockSandboxUSDC, abi: MockSandboxUSDCAbi, functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15000 },
  });
  const faucetCooldown = Number((faucetCdRaw as bigint | undefined) ?? 0n);

  // Quote — call quoter via publicClient simulate (Quoter v1 reverts on view)
  useEffect(() => {
    let cancelled = false;
    if (!amountInStr || amountInStr === "0" || amountInStr === "0.") {
      setQuoted(undefined);
      return;
    }
    let amountIn: bigint;
    try {
      amountIn = parseUnits(amountInStr, decIn);
    } catch {
      setQuoted(undefined);
      return;
    }
    if (amountIn <= 0n) { setQuoted(undefined); return; }
    setQuoting(true);
    (async () => {
      try {
        const { result } = await publicClient.simulateContract({
          address: SANDBOX.uniV3Quoter,
          abi: QuoterAbi,
          functionName: "quoteExactInputSingle",
          args: [{ tokenIn, tokenOut, amountIn, fee: POOL_FEE, sqrtPriceLimitX96: 0n }],
        });
        // QuoterV2 returns 4-tuple; we take the first (amountOut).
        const tuple = result as unknown as readonly [bigint, bigint, number, bigint];
        if (!cancelled) setQuoted(tuple[0]);
      } catch {
        if (!cancelled) setQuoted(undefined);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [amountInStr, tokenIn, tokenOut, decIn]);

  // Slippage-adjusted min out
  const minOut: bigint | undefined = quoted ? (quoted * BigInt(10000 - SLIPPAGE_BPS)) / 10000n : undefined;

  // Write hooks
  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: writeSwap, data: swapHash, isPending: swapping } = useWriteContract();
  const { isSuccess: swapOk, isLoading: swapConfirm } = useWaitForTransactionReceipt({ hash: swapHash });
  const { writeContract: writeFaucet, data: faucetHash, isPending: fauceting } = useWriteContract();
  const { isSuccess: faucetOk, isLoading: faucetConfirm } = useWaitForTransactionReceipt({ hash: faucetHash });

  useEffect(() => {
    if (approveOk) void refetchAllowance();
  }, [approveOk, refetchAllowance]);

  useEffect(() => {
    if (swapOk) {
      void refetchCcmBal();
      void refetchUsdcBal();
      setAmountInStr("");
      setQuoted(undefined);
      pingActivityFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapOk]);

  useEffect(() => {
    if (faucetOk) {
      void refetchUsdcBal();
      void refetchFaucetCd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faucetOk]);

  function onApprove() {
    writeApprove({
      address: tokenIn,
      abi: isCcmIn ? CCMTokenAbi : MockSandboxUSDCAbi,
      functionName: "approve",
      args: [SANDBOX.uniV3SwapRouter02, maxUint256],
    });
  }

  function onSwap() {
    if (!address || !quoted || !minOut) return;
    let amountIn: bigint;
    try {
      amountIn = parseUnits(amountInStr, decIn);
    } catch { return; }
    if (amountIn <= 0n) return;
    writeSwap({
      address: SANDBOX.uniV3SwapRouter02,
      abi: SwapRouter02Abi,
      functionName: "exactInputSingle",
      args: [{
        tokenIn,
        tokenOut,
        fee: POOL_FEE,
        recipient: address,
        amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n,
      }],
    });
  }

  function onFaucet() {
    writeFaucet({
      address: SANDBOX.mockSandboxUSDC,
      abi: MockSandboxUSDCAbi,
      functionName: "faucet",
    });
  }

  function onFlip() {
    setDirection((d) => (d === "ccm-to-usdc" ? "usdc-to-ccm" : "ccm-to-usdc"));
    setAmountInStr("");
    setQuoted(undefined);
  }

  let amountInWei: bigint = 0n;
  try {
    amountInWei = amountInStr ? parseUnits(amountInStr, decIn) : 0n;
  } catch { amountInWei = 0n; }

  const needsApproval = amountInWei > 0n && (!allowance || (allowance as bigint) < amountInWei);
  const balanceIn = isCcmIn ? (ccmBal as bigint | undefined) : (usdcBal as bigint | undefined);
  const insufficient = balanceIn !== undefined && amountInWei > balanceIn;
  const swapDisabled = !isConnected || !quoted || amountInWei <= 0n || insufficient || swapping || swapConfirm;

  if (!isConnected) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.12em", display: "block" };
  const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: 14, width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <div className="r-swap">
        <div>
          <label style={labelStyle}>{t("step5.from")} — {symIn}</label>
          <input
            type="text"
            value={amountInStr}
            onChange={(e) => setAmountInStr(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.0"
            style={inputStyle}
          />
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-soft)" }}>
            {t("step5.balance")}: {fmt(balanceIn, decIn, decIn === 6 ? 2 : 4)} {symIn}
          </div>
        </div>
        <button
          onClick={onFlip}
          title={t("step5.flip")}
          style={{
            border: "1px solid var(--rule)", background: "transparent", padding: "8px 12px",
            cursor: "pointer", fontSize: 14, marginBottom: 22,
          }}
        >
          ⇅
        </button>
        <div>
          <label style={labelStyle}>{t("step5.to")} — {symOut}</label>
          <input
            type="text"
            value={quoting ? "…" : (quoted !== undefined ? fmt(quoted, decOut, decOut === 6 ? 4 : 4) : "")}
            readOnly
            placeholder={t("step5.noQuote")}
            style={{ ...inputStyle, opacity: 0.7 }}
          />
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-soft)" }}>
            {minOut !== undefined && <span>{t("step5.slippage")}: {fmt(minOut, decOut, decOut === 6 ? 4 : 4)}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        {needsApproval ? (
          <button
            onClick={onApprove}
            disabled={approving}
            style={{
              background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)",
              padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
            }}
          >
            {approving ? "…" : `${t("step5.approve")} ${symIn}`}
          </button>
        ) : (
          <button
            onClick={onSwap}
            disabled={swapDisabled}
            style={{
              background: swapDisabled ? "transparent" : "var(--moss)",
              color: swapDisabled ? "var(--ink-soft)" : "var(--paper)",
              border: swapDisabled ? "1px solid var(--rule)" : "0",
              padding: "8px 18px", cursor: swapDisabled ? "not-allowed" : "pointer",
              fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
            }}
          >
            {swapping || swapConfirm ? "…" : t("step5.swap")}
          </button>
        )}

        {/* sUSDC faucet — always visible */}
        <button
          onClick={onFaucet}
          disabled={faucetCooldown > 0 || fauceting || faucetConfirm}
          title={faucetCooldown > 0 ? `wait ${fmtCooldown(faucetCooldown)}` : ""}
          style={{
            background: "transparent",
            color: faucetCooldown > 0 ? "var(--ink-soft)" : "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "8px 14px", cursor: faucetCooldown > 0 ? "not-allowed" : "pointer",
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            marginLeft: "auto",
          }}
        >
          {fauceting || faucetConfirm
            ? "…"
            : faucetCooldown > 0
              ? t("step5.faucetCooldown", { time: fmtCooldown(faucetCooldown) })
              : t("step5.faucet")}
        </button>
      </div>

      {insufficient && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--warn, #c8602e)" }}>
          insufficient {symIn} balance
        </div>
      )}
    </div>
  );
}
