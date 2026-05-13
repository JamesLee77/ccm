import { useReadContract } from "wagmi";
import { CONTRACTS, CCMSandboxNFTAbi } from "../lib/contracts";
import NFTSandbox from "../components/NFTSandbox";
import WrapCard from "../components/WrapCard";
import GradeWrapperCard from "../components/GradeWrapperCard";
import LendingCard from "../components/LendingCard";
import FractionalizeCard from "../components/FractionalizeCard";
import YieldCard from "../components/YieldCard";
import InsuranceCard from "../components/InsuranceCard";
import IndexBasketCard from "../components/IndexBasketCard";
import RebateCard from "../components/RebateCard";

const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const ZERO = "0x0000000000000000000000000000000000000000";
const nftDeployed = NFT.toLowerCase() !== ZERO;

export default function Demo() {
  const { data: nextId } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "nextId",
    query: { enabled: nftDeployed, refetchInterval: 15000 },
  });
  const { data: retiredTotal } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "retiredTotal",
    query: { enabled: nftDeployed, refetchInterval: 15000 },
  });

  return (
    <div className="space-y-10">
      <header>
        <div
          className="font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Demo
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            fontWeight: 300,
            margin: 0,
          }}
        >
          Mint, hold, retire — on the sandbox.
        </h1>
        <p
          className="mt-6 max-w-[640px]"
          style={{
            color: "var(--tn-text-soft)",
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          The flows below mirror the protocol surface that will ship on
          mainnet. Each is self-contained: nothing here transfers to or
          from mainnet, and tokens issued have no real value.
        </p>
      </header>

      {/* Live network counters */}
      <section
        className="grid gap-1 grid-cols-2 sm:grid-cols-3"
        style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
      >
        <Stat
          label="Sandbox NFTs minted"
          value={nextId !== undefined ? nextId.toString() : "—"}
        />
        <Stat
          label="Total retired (tCO₂e)"
          value={retiredTotal !== undefined ? retiredTotal.toString() : "—"}
        />
        <Stat label="Chain" value="Base Sepolia · 84532" />
      </section>

      {/* Live mint + retire UI */}
      <NFTSandbox />

      {/* Wrap / Unwrap (NFT ⇄ blended test $CCM) */}
      <WrapCard />

      {/* §7.3 Grade Wrappers (NFT ⇄ grade-specific $CCM-A/B/C/D) */}
      <GradeWrapperCard />

      {/* §7.4 Vault Lending (NFT collateral → USDC) */}
      <LendingCard />

      {/* §7.5 Fractionalization (NFT → ERC-20 fraction series) */}
      <FractionalizeCard />

      {/* §7.6 Hold-to-Earn (NFT staking, grade-weighted CCM yield) */}
      <YieldCard />

      {/* §7.7 Insurance Vault (VVB failure → pro-rata USDC payout) */}
      <InsuranceCard />

      {/* §7.8 Index Baskets (PRIME / FOREST / TECH ETF-style baskets) */}
      <IndexBasketCard />

      {/* §7.9 Retire-to-Earn (NFT burn → tier-multiplied CCM rebate) */}
      <RebateCard />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--tn-surface)", padding: "20px 24px" }}>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      <div
        className="font-display mt-2"
        style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}
