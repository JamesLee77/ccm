import { TESTNET_FAUCETS } from "../lib/contracts";

export default function About() {
  return (
    <article className="space-y-12">
      <header>
        <div
          className="font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          About this sandbox
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
          What is testnet, and why does CCM Network have one?
        </h1>
      </header>

      <Section heading="Testnet is a parallel blockchain — fake money, real protocol">
        <p>
          A testnet is a public Ethereum-compatible network designed for
          development and experimentation. The chain follows the same rules
          as the production network ("mainnet"), but the tokens on it are
          freely distributed and have no monetary value.
        </p>
        <p>
          We use <strong style={{ color: "var(--tn-text)" }}>Base Sepolia</strong> (chain ID{" "}
          <code className="font-mono">84532</code>), the Base ecosystem's
          public testnet. The CCM Network smart contracts deployed there
          run identical bytecode to what will eventually run on Base
          mainnet — which means anything that works in this sandbox will
          work in production.
        </p>
      </Section>

      <Section heading="Why we expose testnet publicly">
        <p>
          The CCM whitepaper describes a protocol with several novel
          properties — grade-aware credits, dual NFT/ERC-20 representation,
          on-chain retirement, eight DeFi primitives. Words can describe
          the system, but only running code demonstrates it.
        </p>
        <p>
          Rather than describe the protocol in screenshots, we let you{" "}
          <strong style={{ color: "var(--tn-text)" }}>actually use it</strong>{" "}
          — mint a demo credit, wrap it, retire it, watch the events emit on
          BaseScan. Every step is reversible, every test transaction
          costs only fake gas, and every artifact stays on Sepolia.
        </p>
      </Section>

      <Section heading="What testnet is NOT">
        <ul className="grid gap-3 list-disc pl-5">
          <li>
            <strong style={{ color: "var(--tn-text)" }}>Not a sale.</strong>{" "}
            Test tokens here are minted on demand for free. They are not for
            sale, not redeemable for anything, and have no relationship to
            future $CCM mainnet supply.
          </li>
          <li>
            <strong style={{ color: "var(--tn-text)" }}>Not the real protocol.</strong>{" "}
            Mainnet contracts will be governed by a multisig, gated by
            timelock, and audited by an external firm. Testnet relaxes
            those guards so anyone can experiment.
          </li>
          <li>
            <strong style={{ color: "var(--tn-text)" }}>Not bridged to mainnet.</strong>{" "}
            There is no path that lets a testnet token become a mainnet
            token. The two chains are independent.
          </li>
        </ul>
      </Section>

      <Section heading="Faucets — get free test ETH">
        <p>
          You need a small amount of test ETH on Base Sepolia to pay gas
          for sandbox transactions. Use any of these public faucets (we
          do not run our own):
        </p>
        <ul className="grid gap-2 mt-4">
          {TESTNET_FAUCETS.map((f) => (
            <li key={f.name}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
                style={{ color: "var(--tn-amber-text)" }}
              >
                {f.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="Safety reminders">
        <ul className="grid gap-3 list-disc pl-5">
          <li>
            Always verify your wallet is on{" "}
            <strong style={{ color: "var(--tn-text)" }}>Base Sepolia</strong>{" "}
            before signing anything. Mainnet has chain ID{" "}
            <code className="font-mono">8453</code>; testnet is{" "}
            <code className="font-mono">84532</code>.
          </li>
          <li>
            This site only knows about Base Sepolia. If you connect a wallet
            on a different network, a full-screen modal will block the page
            until you switch.
          </li>
          <li>
            Never copy-paste a contract address from this site into a
            mainnet wallet. The addresses are sandbox-only.
          </li>
          <li>
            For the production CCM Network and the live whitepaper, visit{" "}
            <a
              href="https://ccmnetwork.net"
              className="underline"
              style={{ color: "var(--tn-amber-text)" }}
            >
              ccmnetwork.net
            </a>
            .
          </li>
        </ul>
      </Section>
    </article>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="font-semibold mb-4"
        style={{ fontSize: 22, letterSpacing: "-0.015em" }}
      >
        {heading}
      </h2>
      <div
        className="grid gap-4"
        style={{
          color: "var(--tn-text-soft)",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </section>
  );
}
