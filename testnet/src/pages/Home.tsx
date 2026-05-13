import { useAccount, useReadContract } from "wagmi";
import { Link } from "react-router-dom";
import {
  CONTRACTS,
  CCMTokenAbi,
  TESTNET_FAUCETS,
  TESTNET_CHAIN_ID,
} from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import CopyableAddress from "../components/CopyableAddress";
import ClaimCard from "../components/ClaimCard";

const ccmToken = CONTRACTS.baseSepolia.ccmToken;
const ZERO = "0x0000000000000000000000000000000000000000";
const contractsDeployed = ccmToken.toLowerCase() !== ZERO;

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: ccmBal } = useReadContract({
    address: ccmToken,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && contractsDeployed },
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section>
        <div
          className="font-mono text-[11px] tracking-[0.18em] uppercase mb-6"
          style={{ color: "var(--tn-amber-text)" }}
        >
          CCM Network · sandbox · base sepolia
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(40px, 6vw, 76px)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontWeight: 300,
            margin: 0,
          }}
        >
          Try CCM Network{" "}
          <em className="not-italic" style={{ color: "var(--tn-amber-text)" }}>
            without spending real money.
          </em>
        </h1>
        <p
          className="mt-8 max-w-[640px]"
          style={{
            color: "var(--tn-text-soft)",
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          This is the public sandbox for the CCM Network protocol. Connect
          a wallet, switch to Base Sepolia, claim free test ETH, and
          experiment with the contracts as they will run on mainnet — all
          without committing real funds. Test tokens issued here have no
          monetary value and stay on Sepolia.
        </p>
      </section>

      {/* Connect / Balance */}
      <section
        className="border p-7"
        style={{
          background: "var(--tn-surface)",
          borderColor: "var(--tn-border)",
        }}
      >
        {!isConnected ? (
          <>
            <h2
              className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
              style={{ color: "var(--tn-amber-text)" }}
            >
              Step 1 · Connect wallet
            </h2>
            <p
              style={{ color: "var(--tn-text-soft)", fontSize: 15, lineHeight: 1.6 }}
            >
              Use the Connect button in the header. Any EVM wallet works
              (MetaMask, Coinbase Wallet, Rainbow). You'll be asked to
              switch to Base Sepolia (chain id <code className="font-mono">84532</code>).
            </p>
          </>
        ) : (
          <>
            <h2
              className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
              style={{ color: "var(--tn-amber-text)" }}
            >
              Connected · your sandbox state
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <dt
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  Address
                </dt>
                <dd className="mt-2">
                  {address ? <CopyableAddress address={address} withExplorer /> : "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  Test CCM balance
                </dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums">
                  {contractsDeployed
                    ? fmtCCM(ccmBal as bigint | undefined)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  Chain
                </dt>
                <dd className="mt-2 font-mono text-sm">
                  base-sepolia · {TESTNET_CHAIN_ID}
                </dd>
              </div>
            </dl>
            {!contractsDeployed ? (
              <p
                className="mt-6 text-[12px] font-mono"
                style={{ color: "var(--tn-text-soft)" }}
              >
                Note: CCM testnet contracts not yet deployed. Balance lookups
                will activate once they go live.
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* Faucet panel */}
      <section
        className="border p-7"
        style={{
          background: "var(--tn-surface)",
          borderColor: "var(--tn-border)",
        }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-2"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Step 2 · Get free test ETH
        </h2>
        <p
          className="mb-5"
          style={{
            color: "var(--tn-text-soft)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          You need a small amount of test ETH on Base Sepolia to pay gas
          for sandbox transactions. The faucets below distribute free test
          ETH that has <strong style={{ color: "var(--tn-text)" }}>no real value</strong> and
          cannot be exchanged or transferred to mainnet.
        </p>
        <ul className="grid gap-2">
          {TESTNET_FAUCETS.map((f) => (
            <li key={f.name}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between border px-4 py-3 transition-colors"
                style={{
                  borderColor: "var(--tn-border)",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <span className="text-sm">{f.name}</span>
                <span
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-amber-text)" }}
                >
                  open ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Claim test CCM (sandbox faucet) */}
      <ClaimCard />

      {/* What you can try */}
      <section>
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-6"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Step 4 · Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard
            num="01"
            title="Mint a demo CCM-NFT"
            body="Issue a representative carbon credit NFT with grade, vintage, and provenance. The mainnet version is gated by VVB consensus; the testnet version is open to anyone for experimentation."
          />
          <FeatureCard
            num="02"
            title="Wrap NFT ⇆ test $CCM"
            body="Convert your demo NFT into the fungible test $CCM token via the non-custodial vault, then unwrap it back. The 1:1 invariant and FIFR redemption are the same as mainnet."
          />
          <FeatureCard
            num="03"
            title="Retire-to-burn"
            body="Permanently retire a test NFT to simulate the on-chain ESG retirement flow. The receipt is verifiable on BaseScan."
          />
          <FeatureCard
            num="04"
            title="Read protocol state"
            body="Inspect contract balances, total supply, vesting schedules, and migration status — all without authoring a transaction."
          />
        </div>
        <div className="mt-6">
          <Link
            to="/demo"
            className="font-mono text-[11px] tracking-[0.14em] uppercase border px-5 py-3 inline-block transition-colors"
            style={{
              color: "var(--tn-amber-text)",
              borderColor: "var(--tn-amber)",
            }}
          >
            Go to demo →
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <article
      className="border p-6"
      style={{
        background: "var(--tn-surface)",
        borderColor: "var(--tn-border)",
      }}
    >
      <div
        className="font-mono text-[11px] tracking-[0.14em] uppercase mb-3"
        style={{ color: "var(--tn-amber-text)" }}
      >
        §&nbsp;{num}
      </div>
      <h3
        className="font-semibold mb-3"
        style={{ fontSize: 18, letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--tn-text-soft)",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
    </article>
  );
}
