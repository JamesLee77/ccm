import { formatUnits } from "viem";

export function fmtCCM(n: bigint | undefined, dp = 4): string {
  if (n === undefined) return "—";
  const s = formatUnits(n, 18);
  // round to dp decimal places without trailing zeros for cleanliness
  const num = Number(s);
  if (Number.isNaN(num)) return s;
  return num.toLocaleString("en-US", {
    maximumFractionDigits: dp,
    minimumFractionDigits: 0,
  });
}

export function shortAddress(addr?: string): string {
  if (!addr) return "—";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
