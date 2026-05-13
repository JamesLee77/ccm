/**
 * Shared viem public client + base hooks for testnet network viz.
 *
 * All hooks return { data, isLoading, error } shape and poll on a fixed
 * interval. Components compose them; no global state.
 */
import { useEffect, useRef, useState } from "react";
import { createPublicClient, http, parseAbiItem, type Address, type Log } from "viem";
import { baseSepolia } from "viem/chains";
import { SANDBOX } from "./contracts";

export const RPC_URL = (import.meta.env.VITE_BASE_SEPOLIA_RPC as string | undefined) || "https://sepolia.base.org";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

// Event signatures we scan
export const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);
export const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
export const stakedEvent = parseAbiItem(
  "event Staked(address indexed user, uint256 amount, uint256 newTotal)",
);
export const rewardClaimedEvent = parseAbiItem(
  "event RewardClaimed(address indexed user, uint256 amount, uint256 poolRemaining)",
);
export const unstakedEvent = parseAbiItem(
  "event Unstaked(address indexed user, uint256 amount, uint256 newTotal)",
);
export const nodeRegisteredEvent = parseAbiItem(
  "event NodeRegistered(address indexed owner, uint256 indexed nodeId, string label, string endpoint)",
);

/** Block window for log scans — last ~55 hours at 2s/block. */
export const SCAN_WINDOW = 100_000n;

export async function getScanRange(): Promise<{ from: bigint; to: bigint }> {
  const latest = await publicClient.getBlockNumber();
  const from = latest > SCAN_WINDOW ? latest - SCAN_WINDOW : 0n;
  return { from, to: latest };
}

export type Loader<T> = { data: T | undefined; isLoading: boolean; error: Error | undefined };

/** Polls a read function on an interval. */
export function usePolling<T>(fn: () => Promise<T>, intervalMs: number, deps: unknown[] = []): Loader<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      try {
        const result = await fn();
        if (!cancelled && mountedRef.current) {
          setData(result);
          setError(undefined);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled && mountedRef.current) {
          setError(e as Error);
          setLoading(false);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    };
    void tick();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error };
}

/** Cumulative CCM minted across all NFTs (sum of TransferSingle.value where from=0x0). */
export function useCumulativeMinted(): Loader<bigint> {
  return usePolling(async () => {
    const { from, to } = await getScanRange();
    const logs = await publicClient.getLogs({
      address: SANDBOX.ccmSandboxNFT,
      event: transferSingleEvent,
      args: { from: "0x0000000000000000000000000000000000000000" as Address },
      fromBlock: from,
      toBlock: to,
    });
    let total = 0n;
    for (const log of logs) {
      const v = (log as Log & { args: { value: bigint } }).args.value;
      if (v) total += v;
    }
    return total;
  }, 15000, []);
}

/** Number of distinct `to` addresses across NFT mint events in the scan window. */
export function useActiveMiners(): Loader<number> {
  return usePolling(async () => {
    const { from, to } = await getScanRange();
    const logs = await publicClient.getLogs({
      address: SANDBOX.ccmSandboxNFT,
      event: transferSingleEvent,
      args: { from: "0x0000000000000000000000000000000000000000" as Address },
      fromBlock: from,
      toBlock: to,
    });
    const set = new Set<string>();
    for (const log of logs) {
      const lg = log as Log & { args: { to: Address } };
      if (lg.args.to) set.add(lg.args.to.toLowerCase());
    }
    return set.size;
  }, 30000, []);
}

/** Number of NFT mint events in the scan window (proxy for "minted today" given ~55h window). */
export function useMintsRecent(): Loader<number> {
  return usePolling(async () => {
    const { from, to } = await getScanRange();
    const logs = await publicClient.getLogs({
      address: SANDBOX.ccmSandboxNFT,
      event: transferSingleEvent,
      args: { from: "0x0000000000000000000000000000000000000000" as Address },
      fromBlock: from,
      toBlock: to,
    });
    return logs.length;
  }, 15000, []);
}
