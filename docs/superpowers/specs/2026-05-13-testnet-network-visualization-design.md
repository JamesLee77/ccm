# Testnet Network Visualization — Design Spec

**Date:** 2026-05-13
**Author:** james.lee@finenex.net (operator) + Claude
**Status:** Draft for operator review

## 1. Goal

Transform `testnet.ccmnetwork.net` from a 4-step interactive playground into a **full marketing-quality visualization of the testnet ecosystem operating**. Every visible counter, ring, line, and consensus panel must be backed by real Base Sepolia data. A first-time visitor should feel "this network is alive and working" — not "this is a sandbox tutorial".

Verbatim operator brief (2026-05-13): "testnet 시각적인 효과, Node, Mining 상태 등 www.ccmnetwork.net 에 있는 시각적인 이미지를 적용해서 testnet 이 동작하는지 시각적으로 일반인에게 보여줘야 한다. testnet 의 node, oracle 등을 테스트 용으로 만들어서, 완전한 전체 testnet 이 동작하게 보여줘야 한다."

## 2. Scope

**In:**
- Port marketing visualizations (NetworkSnapshot, MiningNetwork, hero counters, Trinity, Atmospheric timeline) from `frontend/src/sections/earth/` to `testnet/` — driven by real Sepolia data where applicable.
- Deploy new on-chain infrastructure: `CCMSandboxNodeRegistry` (open registration) + 3 additional `MockPriceOracle` instances + `CCMSandboxMedianAggregator`.
- Add live activity feed (last N on-chain events: mints, wraps, stakes, claims).
- Keep the existing 4-step playground intact below the new visualization layer.

**Out:**
- Anything that changes mainnet contracts or `ccmnetwork.net`.
- Real Proof-of-Stake validators or off-chain MRV oracles — the existing CCMine/VVB framing on marketing is aspirational; we render testnet-grade equivalents.
- NOAA atmospheric API integration — atmospheric chart stays as static reference data.
- Redeploying `CCMSandboxStaking` to consume the new MedianAggregator. The staking contract retains its existing single oracle binding; the aggregator is **display-only** (visualizes consensus alongside the staking yield rate computed from the single source).

## 3. Decisions (already chosen)

| Decision | Choice |
|---|---|
| What is a "node"? | **Open registration** — anyone calls `register(label, endpoint)`, registry exposes count + recent N entries. |
| Multi-oracle structure | **Median of 3 fixed oracles** — admin deploys 3 additional MockPriceOracles, MedianAggregator takes median of all 4. Display-only. |
| Visual section placement | **Hero replacement + visualization sections above existing 4-step**. Steps stay in current order. |

## 4. Page structure (top → bottom)

1. **Site chrome** — Nav (Wordmark + CCM TESTNET + Theme toggle) + orange testnet banner (unchanged).
2. **Hero banner** — Marketing-style. Headline + lead paragraph + right-side LIVE READOUT panel (cumulative CCM minted + CCM retired counters, driven by real Sepolia events).
3. **Network snapshot strip** — 4 cells, all real: Active CCMine nodes (registry count), CCM minted today (24h NFT event count), CCM staked (totalStaked), Pool remaining (poolRemaining).
4. **Mining network SVG** — Port `MiningNetwork.tsx`. 7 satellite nodes pulse data to central hub. Hub counter = real cumulative mint. Adjacent panel: "Active miners (24h)" + "Latest mint tx" link.
5. **Oracle consensus panel** — 4 oracle cards (Oracle-A, B, C, D) showing each oracle's current price, plus a center MedianAggregator card showing the consensus median. Subtitle: "Multiple price oracles, on-chain median. CCM/USD price feeds the staking yield decay."
6. **Yield curve panel** — Live `currentYieldRateBps` from staking, with annotation showing `R0_bps × priceFactor × poolFactor` decomposition.
7. **Activity feed** — Last 10 events across {NFT.TransferSingle from 0x0, Vault.Wrap, Staking.Staked, Staking.RewardClaimed, NodeRegistry.NodeRegistered}. Newest on top. Each row: timestamp · event type · address (truncated) · amount/details · BaseScan tx link.
8. **Node registration callout** — Connected wallet sees "Register your address as a CCMine node" CTA → opens form (label, optional endpoint URL) → submits `register()` tx → row appears in registry feed.
9. **WalletStatusBar** (existing) — sticky in this region or above.
10. **What you'll need** callout (existing).
11. **Step 1–4 cards** (existing, unchanged).
12. **TryMoreGrid** (existing).
13. **Footer** (existing, plus new addresses for NodeRegistry + 3 oracles + aggregator).

The visualization layer (sections 2–8) is a long, scrolling "network is alive" reveal before the user arrives at the hands-on flow. A user who only scrolls past the hero already gets the "it's working" message.

## 5. New on-chain components

### 5.1. CCMSandboxNodeRegistry

```solidity
contract CCMSandboxNodeRegistry {
  struct Node { address owner; string label; string endpoint; uint64 registeredAt; bool active; }
  Node[] private _nodes;
  mapping(address => uint256) public ownerIndex; // owner → nodes[] index + 1 (0 = none)

  event NodeRegistered(address indexed owner, uint256 indexed nodeId, string label, string endpoint);
  event NodeUnregistered(address indexed owner, uint256 indexed nodeId);
  event NodeUpdated(address indexed owner, uint256 indexed nodeId, string label, string endpoint);

  function register(string calldata label, string calldata endpoint) external returns (uint256 nodeId);
  function unregister() external;
  function update(string calldata label, string calldata endpoint) external;
  function count() external view returns (uint256);
  function recent(uint256 n) external view returns (Node[] memory);
  function nodeOf(address owner) external view returns (Node memory);
}
```

Constraints: `label` length ≤ 64, `endpoint` length ≤ 128, optional (allow empty). One node per address (re-registration updates in place). Anti-spam: emit `NodeRegistered` only on first-time register, otherwise `NodeUpdated`.

### 5.2. Additional MockPriceOracles (3 new)

Three additional deployments of existing `MockPriceOracle` (each with its own `setPrice` admin). Initial prices intentionally diverge to demonstrate consensus:
- Oracle-A: `0.20 * 10^18` (matches existing primary oracle)
- Oracle-B: `0.21 * 10^18` (slight premium)
- Oracle-C: `0.19 * 10^18` (slight discount)
- (Existing oracle counts as Oracle-D, price `0.20`)

### 5.3. CCMSandboxMedianAggregator

```solidity
contract CCMSandboxMedianAggregator {
  IPriceSource[4] public sources;
  constructor(address a, address b, address c, address d);
  function getPrice() external view returns (uint256);
  function sourcePrices() external view returns (uint256[4] memory);
  function name() external pure returns (string memory) { return "median-of-4"; }
}
```

Pure read-only median of `sourcePrices()`. No mutability. No auth.

**Note:** The aggregator is NOT wired into `CCMSandboxStaking` — staking continues to read its existing single oracle. Aggregator is display-only.

## 6. Frontend components (new)

All in `testnet/src/components/` unless noted.

| Component | Path | Description |
|---|---|---|
| `HeroBanner` | `marketing/HeroBanner.tsx` | Marketing-style hero with right-side LIVE READOUT panel (cumulative mint + retire). Replaces current sparse hero in Playground.tsx. |
| `LiveNetworkState` | `marketing/LiveNetworkState.tsx` | 4-cell strip with `LIVE · NETWORK STATE` heading. Cells driven by real Sepolia reads + log scans. |
| `MiningNetworkViz` | `marketing/MiningNetworkViz.tsx` | Port of `MiningNetwork.tsx` SVG. Hub counter wired to real cumulative NFT mint. |
| `OracleConsensusPanel` | `marketing/OracleConsensusPanel.tsx` | 4 oracle cards + center median card. Refetches `getPrice` on each + aggregator every 10s. |
| `YieldCurvePanel` | `marketing/YieldCurvePanel.tsx` | Live `currentYieldRateBps` with decomposition annotations. |
| `ActivityFeed` | `marketing/ActivityFeed.tsx` | Last 10 events. Filters: All / Mints / Wraps / Stakes / Claims / Nodes. Polling every 15s. |
| `NodeRegistrationCallout` | `playground/NodeRegistrationCallout.tsx` | Connected-wallet CTA. Form (label, endpoint) → `NodeRegistry.register()`. Shows current registration status if already registered. |
| `lib/onchain.ts` | `testnet/src/lib/onchain.ts` | Shared viem public client + helper hooks: `useCumulativeMinted()`, `useActiveNodeCount()`, `useRecentEvents()`, `useOraclePrices()`, `useYieldDecomposition()`. All polling-based, no WebSocket. |

## 7. Data sources

| Visual | Read source | Refresh |
|---|---|---|
| Cumulative CCM minted | `getLogs` for `CCMSandboxNFT.TransferSingle(from=0x0)` from block 22000000 → latest, sum `value` | Every 15s |
| CCM minted today | Same logs filtered to last 24h by block timestamp | Every 15s |
| CCM staked | `CCMSandboxStaking.totalStaked()` | Every 10s |
| Pool remaining | `CCMSandboxStaking.poolRemaining()` | Every 10s |
| Current yield rate | `CCMSandboxStaking.currentYieldRateBps()` | Every 5s |
| Oracle-A/B/C/D prices | `getPrice()` on each | Every 10s |
| Median price | `MedianAggregator.getPrice()` | Every 10s |
| Active node count | `NodeRegistry.count()` | Every 30s + on transaction receipts |
| Recent nodes | `NodeRegistry.recent(10)` | Every 30s |
| Active miners (24h) | Same NFT logs, count distinct `to` | Every 30s |
| Activity feed | Multi-contract `getLogs` for last N events across NFT, Vault, Staking, NodeRegistry | Every 15s |

Block scan window: last 100,000 blocks (~55 hours on Base Sepolia at 2s/block). Adjust if scans become slow.

## 8. Component placement in Playground.tsx

```tsx
<TestnetLayout>
  <HeroBanner />                  {/* §2 */}
  <LiveNetworkState />            {/* §3 */}
  <MiningNetworkViz />            {/* §4 */}
  <OracleConsensusPanel />        {/* §5 */}
  <YieldCurvePanel />             {/* §6 */}
  <ActivityFeed />                {/* §7 */}
  <NodeRegistrationCallout />     {/* §8 */}

  {/* Existing — unchanged */}
  <WalletStatusBar />
  <NeedsCallout />
  <StepCard step={1} ...><MintForm /><NFTInventory /></StepCard>
  <StepCard step={2} ...><WrapForm /></StepCard>
  <StepCard step={3} ...><StakeForm /></StepCard>
  <StepCard step={4} ...><RewardPanel /></StepCard>
  <TryMoreGrid />
</TestnetLayout>
```

## 9. Error handling & loading states

- All read hooks return `{ data, isLoading, error }` shape.
- Loading: show 11px monospace `…` placeholder in the value position, ring/hub paused.
- RPC error: show `⚠ rpc` in red-orange in the cell, retry button.
- Empty data (no events ever): show "Waiting for first activity…" in placeholder rows.
- Mining network SVG with `prefers-reduced-motion: reduce` → animation disabled, hub still updates counter.

## 10. Visual / brand

- Tokens: existing `testnet/src/index.css` (paper, ink, moss, rule, paper-deep, warn) — unchanged.
- Typography: existing space-grotesk / jetbrains-mono.
- Spacing: 32–48px between marketing sections, 24px between step cards.
- The four 4-cell strips (LiveNetworkState, OracleConsensus, etc.) follow the same `repeat(4, 1fr)` grid with 1px gap and `var(--rule)` separator background — visual consistency with marketing site.

## 11. Testing strategy

| Layer | Test |
|---|---|
| `CCMSandboxNodeRegistry.sol` | Hardhat unit tests: register (first time + update), unregister, count, recent(N) ordering, recent over count, multi-address scenarios. Target ≥ 8 tests. |
| `CCMSandboxMedianAggregator.sol` | Hardhat unit tests: median of 4 (sorted/unsorted), all-equal case, returns sum of `sourcePrices()` interpreted correctly. Target ≥ 4 tests. |
| Frontend hooks | Vitest unit tests for `useRecentEvents` aggregator (mocked logs) + `useYieldDecomposition` math. |
| Visual smoke | Playwright (or manual browser): page loads, hero renders, mining SVG animates, oracle panel shows 4 + median, activity feed eventually populates after a test mint. |

## 12. Deployment sequence

1. Compile + unit-test new contracts (forked-mainnet check: refuses chainId 8453).
2. Deploy on Sepolia: 3 oracles, MedianAggregator, NodeRegistry. Record addresses.
3. Pre-seed: admin registers 5 demo nodes (varied labels) so first visitor sees activity even before community joins.
4. Pre-seed: admin sets Oracle-A=0.20, Oracle-B=0.21, Oracle-C=0.19, leaving original D=0.20 → median = 0.20.
5. Update `testnet/src/lib/contracts.ts` with new addresses.
6. Build + deploy `ccm-testnet` Pages (production branch).
7. Manual visual smoke.
8. Update `DEPLOYMENT.md` (sandbox section + new section "Testnet network viz").

## 13. Open questions (operator can override)

1. **Pre-seed node count** — 5 demo nodes seems right (matches "47 active" marketing optic at lower-but-real scale). Adjust?
2. **Oracle decimals** — same as existing MockPriceOracle (1e18). Confirmed.
3. **NodeRegistry max nodes** — no hard cap (open). If spam becomes a problem, add admin-set max later.
4. **Activity feed depth** — last 10 across all event types. Adjust if too sparse/dense in practice.
5. **MiningNetwork satellite count** — fixed at 7 (matches marketing). Could be `Math.min(NodeRegistry.count(), 12)` for dynamic feel — TBD post-launch.

## 14. Out-of-scope / future

- Real oracle keeper bot rotating prices on-chain so consensus drifts naturally (currently admin must call `setPrice` periodically — or pre-seed once).
- Animated atmospheric ppm panel pulling live NOAA data.
- Marketing-grade "Why now" / "Failure modes" / "Bitcoin analogue" / "Trinity" sections — these are static copy from the marketing site; could be ported but lower priority since the focus is "show testnet operating". Defer.
- Server-Sent Events / WebSocket for activity feed (polling is fine at testnet scale).
- IndexedDB caching of historical event scan to reduce RPC load on revisits.
