import { formatUnits } from "viem";

export function formatCCM(amount: bigint, maxFractionDigits = 4): string {
  const s = formatUnits(amount, 18);
  const num = Number(s);
  if (!Number.isFinite(num)) return s;
  return num.toLocaleString("en-US", {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

export function formatUnlockDate(unixSeconds: bigint): string {
  const d = new Date(Number(unixSeconds) * 1000);
  return d.toISOString().slice(0, 10);
}
