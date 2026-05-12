import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS, CCMTokenAbi } from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import CopyableAddress from "../components/CopyableAddress";
import AddCCMToWallet from "../components/AddCCMToWallet";
import { Card, H1, H2, H3, Lede, SectionLabel, DefRow, Stat } from "../components/site/primitives";

const v1 = CONTRACTS.ccmTokenV1;
const v2 = CONTRACTS.ccmTokenV2;
const vesting = CONTRACTS.ccmVesting;
const migration = CONTRACTS.ccmMigration;

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: v1Info } = useReadContracts({
    contracts: [
      { address: v1, abi: CCMTokenAbi, functionName: "name" },
      { address: v1, abi: CCMTokenAbi, functionName: "symbol" },
      { address: v1, abi: CCMTokenAbi, functionName: "VERSION" },
      { address: v1, abi: CCMTokenAbi, functionName: "totalSupply" },
      { address: v1, abi: CCMTokenAbi, functionName: "cap" },
      { address: v1, abi: CCMTokenAbi, functionName: "paused" },
    ],
  });
  const { data: v2Info } = useReadContracts({
    contracts: [
      { address: v2, abi: CCMTokenAbi, functionName: "totalSupply" },
      { address: v2, abi: CCMTokenAbi, functionName: "VERSION" },
    ],
  });
  const { data: v1Bal } = useReadContract({
    address: v1, abi: CCMTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: v2Bal } = useReadContract({
    address: v2, abi: CCMTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return (
    <div className="space-y-12">
      <header>
        <SectionLabel className="mb-4">Investor Portal</SectionLabel>
        <H1>SAFT investor dashboard</H1>
        <Lede className="mt-6">
          Phase 0 portal on Base mainnet. Connect your wallet to view your
          vesting schedule, claim vested tokens, and (if a v2 audit fix
          becomes necessary) migrate v1 → v2 after the audit. KYC required.
        </Lede>
      </header>

      {!isConnected && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            Connect your wallet from the top right to continue.
          </p>
        </Card>
      )}

      {isConnected && (
        <Card>
          <SectionLabel className="mb-4">Your balances</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                Address
              </div>
              <div>{address && <CopyableAddress address={address} withExplorer />}</div>
            </div>
            <Stat label="v1 CCM" value={fmtCCM(v1Bal as bigint | undefined)} />
            <Stat label="v2 CCM" value={fmtCCM(v2Bal as bigint | undefined)} />
          </div>
          <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--rule)" }}>
            <AddCCMToWallet />
          </div>
        </Card>
      )}

      <Card>
        <H2 className="mb-5">Contracts (Base mainnet)</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <DefRow label="CCMToken v1" value={<CopyableAddress address={v1} withExplorer />} />
          <DefRow label="CCMVesting" value={<CopyableAddress address={vesting} withExplorer />} />
          <DefRow label="CCMToken v2" value={<CopyableAddress address={v2} withExplorer />} />
          <DefRow label="CCMMigration" value={<CopyableAddress address={migration} withExplorer />} />
        </div>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <H3>CCM v1</H3>
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
              style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
            >
              {(v1Info?.[2]?.result as string | undefined) ?? "—"}
            </span>
          </div>
          <div>
            <DefRow label="Name" value={(v1Info?.[0]?.result as string | undefined) ?? "—"} />
            <DefRow label="Symbol" value={(v1Info?.[1]?.result as string | undefined) ?? "—"} />
            <DefRow label="Total supply" value={fmtCCM(v1Info?.[3]?.result as bigint | undefined)} />
            <DefRow label="Cap" value={fmtCCM(v1Info?.[4]?.result as bigint | undefined, 0)} />
            <DefRow label="Paused" value={(v1Info?.[5]?.result as boolean | undefined) ? "yes" : "no"} />
            <DefRow label="Address" value={<CopyableAddress address={v1} withExplorer />} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <H3>CCM v2 (migration target)</H3>
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
              style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
            >
              {(v2Info?.[1]?.result as string | undefined) ?? "—"}
            </span>
          </div>
          <div>
            <DefRow label="Total supply" value={fmtCCM(v2Info?.[0]?.result as bigint | undefined)} />
            <DefRow label="Address" value={<CopyableAddress address={v2} withExplorer />} />
          </div>
        </Card>
      </section>
    </div>
  );
}
