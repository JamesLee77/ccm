import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import Section from "../site/Section";
import Heading from "../site/Heading";
import { SANDBOX, CCMSandboxStakingAbi } from "../../lib/contracts";
import { useCumulativeMinted } from "../../lib/onchain";
import { scrollToId } from "../../lib/scroll";

function formatCcm(v: bigint | undefined): string {
  if (v === undefined) return "—";
  const n = Number(formatUnits(v, 18));
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRate(bps: bigint | undefined): string {
  if (bps === undefined) return "—";
  return (Number(bps) / 100).toFixed(2);
}

/** §01 — full-screen hero in the ccmnetwork.net anatomy: headline, lead,
 *  two CTAs, and an instrument panel of real sandbox readouts. */
export default function HeroBanner() {
  const { t } = useTranslation();
  const cumulative = useCumulativeMinted();
  const { data: totalStaked } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "totalStaked",
    query: { refetchInterval: 10000 },
  });
  const { data: rateBps } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "currentYieldRateBps",
    query: { refetchInterval: 5000 },
  });

  return (
    <Section id="vision" noBorder className="hero-chapter" style={{ padding: "72px 56px 96px" }}>
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-10">
        {t("hero.kicker")}
      </div>
      <div className="grid items-end grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr] md:gap-20">
        <div>
          <Heading as="h1" pre={t("hero.headline")} em={t("hero.headlineAccent")} />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 20, lineHeight: 1.55, maxWidth: 600 }}
          >
            {t("hero.lead")}
          </p>
          <div className="flex flex-wrap gap-3 mt-12">
            <a
              href="#playground"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("playground");
              }}
              className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
            >
              {t("hero.ctaPlay")}
            </a>
            <a
              href="https://ccmnetwork.net/protocol"
              className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 border border-moss text-moss hover:bg-moss hover:text-paper transition-colors"
            >
              {t("hero.ctaProtocol")}
            </a>
          </div>
        </div>

        <div className="border border-rule" style={{ background: "var(--paper-deep)", padding: 32 }}>
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden
              className="tn-pulse"
              style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
            />
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
              {t("hero.liveReadout")}
            </span>
          </div>
          <div
            className="font-display text-ink"
            style={{ fontSize: 84, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            {formatRate(rateBps as bigint | undefined)}
            <span className="font-mono text-ink-soft" style={{ fontSize: 18, marginLeft: 10 }}>
              %{t("hero.ratePerMonth")}
            </span>
          </div>
          <div className="font-mono text-ink-soft mt-2 mb-8" style={{ fontSize: 12, letterSpacing: "0.04em" }}>
            {t("hero.rate")}
          </div>
          <div className="border-t border-rule pt-5">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
              {t("hero.cumulative")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-display text-ink" style={{ fontSize: 36 }}>
                  {formatCcm(cumulative.data)}
                </div>
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
                  {t("hero.minted")}
                </div>
              </div>
              <div>
                <div className="font-display text-moss" style={{ fontSize: 36 }}>
                  {formatCcm(totalStaked as bigint | undefined)}
                </div>
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
                  {t("hero.retired")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tn-pulse-anim { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: .5 } }
        .tn-pulse { animation: tn-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tn-pulse { animation: none !important; } }
      `}</style>
    </Section>
  );
}
