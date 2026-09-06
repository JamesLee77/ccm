import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import { SANDBOX, EXPLORER } from "../../lib/contracts";

type Row = { label: string; address: string };

const CORE: Row[] = [
  { label: "CCM Token (sandbox)", address: SANDBOX.ccmToken },
  { label: "CCMSandboxNFT", address: SANDBOX.ccmSandboxNFT },
  { label: "CCMSandboxVault", address: SANDBOX.ccmSandboxVault },
  { label: "CCMSandboxStaking", address: SANDBOX.ccmSandboxStaking },
  { label: "NodeRegistry", address: SANDBOX.nodeRegistry },
];

const ORACLES: Row[] = [
  { label: "Oracle-A", address: SANDBOX.oracleA },
  { label: "Oracle-B", address: SANDBOX.oracleB },
  { label: "Oracle-C", address: SANDBOX.oracleC },
  { label: "Oracle-D (primary)", address: SANDBOX.mockPriceOracle },
  { label: "MedianAggregator", address: SANDBOX.medianAggregator },
];

const DEX: Row[] = [
  { label: "sUSDC", address: SANDBOX.mockSandboxUSDC },
  { label: "Uniswap V3 CCM/sUSDC", address: SANDBOX.uniV3PoolCcmUsdc },
  { label: "Starter pack", address: SANDBOX.starterPack },
];

function short(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function Column({ heading, rows }: { heading: string; rows: Row[] }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3.5">
        {heading}
      </div>
      <div className="grid gap-2 font-mono text-[12px] text-ink-soft">
        {rows.map((r) => (
          <a
            key={r.address}
            href={`${EXPLORER}/address/${r.address}`}
            target="_blank"
            rel="noreferrer"
            className="flex justify-between gap-4 hover:text-moss transition-colors"
            title={r.address}
          >
            <span>{r.label}</span>
            <span className="text-ink">{short(r.address)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Site-style footer: wordmark + contract columns + cross-links. */
export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      className="border-t border-rule"
      style={{ background: "var(--paper-deep)", padding: "64px 56px 48px" }}
    >
      <div className="grid gap-12 grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Wordmark size={32} />
          <div className="mt-4.5 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft leading-7">
            CCM Foundation
            <br />
            {t("footer.contracts")}
            <br />
            chain id 84532
          </div>
          <div className="mt-6 flex flex-col gap-2 font-mono text-[12px]">
            <a href="https://ccmnetwork.net" className="text-moss hover:underline">
              ccmnetwork.net →
            </a>
            <a href="https://portal.ccmnetwork.net" target="_blank" rel="noreferrer" className="text-moss hover:underline">
              {t("footer.mainnet")} →
            </a>
            <a href="https://github.com/JamesLee77/ccm" target="_blank" rel="noreferrer" className="text-moss hover:underline">
              {t("footer.github")} →
            </a>
          </div>
        </div>
        <Column heading="core" rows={CORE} />
        <Column heading="oracles" rows={ORACLES} />
        <Column heading="dex" rows={DEX} />
      </div>
      <div className="mt-12 pt-6 border-t border-rule flex flex-wrap justify-between gap-2 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft">
        <span>© 2026 CCM Foundation · base sepolia sandbox</span>
        <span>tokens have no real value</span>
      </div>
    </footer>
  );
}
