/**
 * Read-only Base Sepolia testnet readouts for the marketing site.
 *
 * Ported from testnet/src/lib/{contracts,onchain}.ts. Kept as a copy on
 * purpose: the two apps are deployed independently and share no package.
 *
 * One shared poller per query feeds every widget that mounts it, so the
 * site issues one RPC batch per interval regardless of how many readouts
 * are on screen. Polling pauses while the tab is hidden.
 */
import { useEffect, useState } from "react";
import {
  createPublicClient,
  http,
  parseAbi,
  parseAbiItem,
  type Address,
} from "viem";
import { baseSepolia } from "viem/chains";

export const RPC_URL =
  (import.meta.env.VITE_BASE_SEPOLIA_RPC as string | undefined) ||
  "https://sepolia.base.org";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

export const EXPLORER = "https://sepolia.basescan.org";

/** Sandbox contract addresses — mirror of testnet/src/lib/contracts.ts. */
export const SANDBOX = {
  ccmToken: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
  ccmSandboxNFT: "0x9a7c5581460C69347D71733050e080869f6A3b9E" as Address,
  ccmSandboxVault: "0x9b2c71de1D9BAC2E6e2824Deef30085Cbe774E58" as Address,
  ccmSandboxStaking: "0xAaeF319bc3B653DF68502a5A713989BB29ea8C48" as Address,
  nodeRegistry: "0xE9AD5DC60a799Cc037824f2B030E641f4d460136" as Address,
} as const;

const tokenAbi = parseAbi(["function totalSupply() view returns (uint256)"]);
const vaultAbi = parseAbi(["function totalWrapped() view returns (uint256)"]);
const registryAbi = parseAbi(["function count() view returns (uint256)"]);
const stakingAbi = parseAbi([
  "function totalStaked() view returns (uint256)",
  "function poolRemaining() view returns (uint256)",
]);
const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/** Public Base Sepolia RPC caps getLogs at 2000 blocks (~1.1h at 2s/block). */
const SCAN_WINDOW = 2000n;

export type Loader<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

// ─── shared poller ──────────────────────────────────────────────────────

type Listener = () => void;

function createSharedPoller<T>(fn: () => Promise<T>, intervalMs: number) {
  let state: Loader<T> = { data: undefined, isLoading: true, error: undefined };
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let visibilityBound = false;

  const emit = () => listeners.forEach((l) => l());

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const schedule = () => {
    clearTimer();
    if (listeners.size === 0) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    timer = setTimeout(() => void tick(), intervalMs);
  };

  const tick = async () => {
    if (inFlight || listeners.size === 0) return;
    inFlight = true;
    try {
      const data = await fn();
      state = { data, isLoading: false, error: undefined };
    } catch (e) {
      // Keep the last good value; surface the error alongside it.
      state = { data: state.data, isLoading: false, error: e as Error };
    } finally {
      inFlight = false;
      emit();
      schedule();
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") void tick();
    else clearTimer();
  };

  const subscribe = (l: Listener) => {
    listeners.add(l);
    if (listeners.size === 1) {
      if (typeof document !== "undefined" && !visibilityBound) {
        document.addEventListener("visibilitychange", onVisibility);
        visibilityBound = true;
      }
      void tick();
    }
    return () => {
      listeners.delete(l);
      if (listeners.size === 0) {
        clearTimer();
        if (visibilityBound) {
          document.removeEventListener("visibilitychange", onVisibility);
          visibilityBound = false;
        }
      }
    };
  };

  const get = () => state;

  return { subscribe, get };
}

function useShared<T>(poller: ReturnType<typeof createSharedPoller<T>>): Loader<T> {
  const [snap, setSnap] = useState<Loader<T>>(poller.get);
  useEffect(() => {
    setSnap(poller.get());
    return poller.subscribe(() => setSnap(poller.get()));
  }, [poller]);
  return snap;
}

// ─── queries ────────────────────────────────────────────────────────────

export type TestnetSnapshot = {
  /** ERC-20 $CCM total supply, 18 decimals. Equals cumulative wraps minus unwraps. */
  ccmSupply: bigint;
  /** Tonnes of NFT carbon locked in the vault — a plain integer (CCMSandboxVault.totalWrapped += tonnage). */
  vaultTonnage: bigint;
  /** Registered CCMine nodes. */
  nodeCount: bigint;
  /** $CCM staked in the sandbox pool, 18 decimals. */
  totalStaked: bigint;
  /** Reward pool remaining, 18 decimals. */
  poolRemaining: bigint;
};

async function fetchSnapshot(): Promise<TestnetSnapshot> {
  const [ccmSupply, vaultTonnage, nodeCount, totalStaked, poolRemaining] =
    await publicClient.multicall({
      allowFailure: false,
      contracts: [
        { address: SANDBOX.ccmToken, abi: tokenAbi, functionName: "totalSupply" },
        { address: SANDBOX.ccmSandboxVault, abi: vaultAbi, functionName: "totalWrapped" },
        { address: SANDBOX.nodeRegistry, abi: registryAbi, functionName: "count" },
        { address: SANDBOX.ccmSandboxStaking, abi: stakingAbi, functionName: "totalStaked" },
        { address: SANDBOX.ccmSandboxStaking, abi: stakingAbi, functionName: "poolRemaining" },
      ],
    });
  return { ccmSupply, vaultTonnage, nodeCount, totalStaked, poolRemaining };
}

async function fetchRecentMints(): Promise<number> {
  const latest = await publicClient.getBlockNumber();
  const from = latest > SCAN_WINDOW ? latest - SCAN_WINDOW : 0n;
  const logs = await publicClient.getLogs({
    address: SANDBOX.ccmSandboxNFT,
    event: transferSingleEvent,
    args: { from: ZERO },
    fromBlock: from,
    toBlock: latest,
  });
  return logs.length;
}

const snapshotPoller = createSharedPoller(fetchSnapshot, 15_000);
const recentMintsPoller = createSharedPoller(fetchRecentMints, 30_000);

/** Single multicall every 15s: supply, vault tonnage, nodes, staked, pool. */
export function useTestnetSnapshot(): Loader<TestnetSnapshot> {
  return useShared(snapshotPoller);
}

/** NFT mint events in the last ~1h (2000-block scan window), every 30s. */
export function useRecentMints(): Loader<number> {
  return useShared(recentMintsPoller);
}

// ─── formatting ─────────────────────────────────────────────────────────

export const WAD = 10n ** 18n;

/** 18-decimal amount → whole units with thousands separators; `—` when unknown. */
export function fmtWad(v: bigint | undefined): string {
  if (v === undefined) return "—";
  return Number(v / WAD).toLocaleString("en-US");
}

/** Plain integer bigint → thousands separators; `—` when unknown. */
export function fmtInt(v: bigint | number | undefined): string {
  if (v === undefined) return "—";
  return Number(v).toLocaleString("en-US");
}

/** vault / supply as a percentage string, `—` when supply is zero or unknown. */
export function fmtRatio(num: bigint | undefined, den: bigint | undefined): string {
  if (num === undefined || den === undefined || den === 0n) return "—";
  const pct = Number((num * 10_000n) / den) / 100;
  return `${pct.toFixed(1)}%`;
}
