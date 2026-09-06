import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Section from "../components/site/Section";
import SectionLabel from "../components/site/SectionLabel";
import Heading from "../components/site/Heading";
import Chapter from "../components/site/Chapter";
import ChapterRail from "../components/site/ChapterRail";
import { useTestnetSnapshot, fmtWad, fmtInt } from "../lib/testnet";
import FailureGrid from "../sections/earth/problem/FailureGrid";
import TrinityCards from "../sections/earth/trinity/TrinityCards";
import WrapStudio from "../sections/earth/wrap/WrapStudio";
import VaultLedger from "../sections/earth/wrap/VaultLedger";
import GradeTable from "../sections/earth/grades/GradeTable";
import AllocationPanel from "../sections/earth/tokenomics/AllocationPanel";
import { PhaseTrack, PhaseDetail } from "../sections/earth/roadmap/PhaseTrack";
import PathwayCards from "../sections/earth/manifesto/PathwayCards";
import DocumentsLibrary from "../sections/earth/manifesto/DocumentsLibrary";
import ContactPanel from "../sections/earth/manifesto/ContactPanel";

const TESTNET_URL = "https://testnet.ccmnetwork.net";

const RAIL_IDS = [
  "vision",
  "problem",
  "trinity",
  "wrap",
  "grades",
  "tokenomics",
  "roadmap",
  "manifesto",
] as const;

// ─── §01 hero ───────────────────────────────────────────────────────────

function HeroReadout() {
  const { t } = useTranslation("earth");
  const { data, error } = useTestnetSnapshot();
  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: 32 }}
      data-testid="hero-readout"
    >
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-4">
        {t("hero.readout.label")}
      </div>
      <div
        className="font-display text-ink"
        style={{ fontSize: 84, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1 }}
      >
        {t("hero.readout.ppm")}
        <span className="font-mono text-ink-soft" style={{ fontSize: 18, marginLeft: 10 }}>
          ppm
        </span>
      </div>
      <div className="font-mono text-ink-soft mt-2 mb-8" style={{ fontSize: 12, letterSpacing: "0.04em" }}>
        {t("hero.readout.ppmCaption")}
      </div>
      <div className="border-t border-rule pt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
            {t("hero.readout.cumulative")}
          </span>
          {error ? (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-clay">
              · {t("hero.readout.offline")}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-display text-ink" style={{ fontSize: 36 }} data-testid="readout-minted">
              {fmtWad(data?.ccmSupply)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
              {t("hero.readout.mintedLabel")}
            </div>
          </div>
          <div>
            <div className="font-display text-moss" style={{ fontSize: 36 }} data-testid="readout-nodes">
              {fmtInt(data?.nodeCount)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
              {t("hero.readout.nodesLabel")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useTranslation("earth");
  return (
    <Section
      id="vision"
      noBorder
      className="hero-chapter"
      style={{ padding: "72px 56px 96px" }}
    >
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-10">
        {t("hero.meta")}
      </div>
      <div className="grid items-end grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr] md:gap-20">
        <div>
          <Heading as="h1" pre={t("hero.h1Pre")} em={t("hero.h1Em")} />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 22, lineHeight: 1.5, maxWidth: 560 }}
          >
            {t("hero.lead")}
          </p>
          <div className="flex flex-wrap gap-3 mt-12">
            <Link
              to="/whitepaper"
              className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
            >
              {t("hero.ctaPaper")}
            </Link>
            <a
              href={TESTNET_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 border border-moss text-moss hover:bg-moss hover:text-paper transition-colors"
            >
              {t("hero.ctaTestnet")}
            </a>
          </div>
        </div>
        <HeroReadout />
      </div>
    </Section>
  );
}

// ─── §07 roadmap ────────────────────────────────────────────────────────

function RoadmapVisual() {
  const [active, setActive] = useState<string>("p1");
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-[1.4fr_1fr]">
      <PhaseTrack active={active} onActive={setActive} />
      <PhaseDetail active={active} />
    </div>
  );
}

// ─── §08 closing ────────────────────────────────────────────────────────

function Closing() {
  const { t } = useTranslation("earth");
  const { t: th } = useTranslation("home");
  return (
    <Section id="manifesto" tone="inverted">
      <SectionLabel index="§ 08">{th("chapters.manifesto.label")}</SectionLabel>
      <div
        className="font-display text-ink mt-8"
        style={{
          fontWeight: 300,
          fontSize: "clamp(40px, 6vw, 96px)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          maxWidth: 1200,
        }}
      >
        {t("manifesto.h1")}
      </div>
      <div className="flex gap-3 mt-12">
        <Link
          to="/whitepaper"
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
        >
          {t("manifesto.ctaPaper")} →
        </Link>
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-20">
        {t("manifesto.pathwaysLabel")}
      </div>
      <PathwayCards />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("manifesto.documentsLabel")}
      </div>
      <DocumentsLibrary />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("manifesto.contactLabel")}
      </div>
      <ContactPanel />
    </Section>
  );
}

// ─── page ───────────────────────────────────────────────────────────────

export default function Home() {
  const { t } = useTranslation("home");
  const rail = RAIL_IDS.map((id) => ({ id, label: t(`rail.${id}`) }));
  const ch = (key: string) => ({
    label: t(`chapters.${key}.label`),
    pre: t(`chapters.${key}.pre`),
    em: t(`chapters.${key}.em`),
    lead: t(`chapters.${key}.lead`),
  });
  const deeper = (key: string, to: string) => ({ to, label: t(`chapters.${key}.deeper`) });

  return (
    <>
      <ChapterRail items={rail} />
      <Hero />

      <Chapter id="problem" index="02" tone="deep" {...ch("problem")} deeper={deeper("problem", "/market")}>
        <FailureGrid />
      </Chapter>

      <Chapter id="trinity" index="03" {...ch("trinity")} deeper={deeper("trinity", "/protocol")}>
        <TrinityCards />
      </Chapter>

      <Chapter id="wrap" index="04" tone="deep" {...ch("wrap")} deeper={deeper("wrap", "/protocol#wrap")}>
        <WrapStudio />
        <div className="mt-6">
          <VaultLedger />
        </div>
      </Chapter>

      <Chapter id="grades" index="05" {...ch("grades")} deeper={deeper("grades", "/protocol#grades")}>
        <GradeTable />
      </Chapter>

      <Chapter id="tokenomics" index="06" tone="deep" {...ch("tokenomics")} deeper={deeper("tokenomics", "/token")}>
        <AllocationPanel />
      </Chapter>

      <Chapter id="roadmap" index="07" {...ch("roadmap")} deeper={deeper("roadmap", "/roadmap")}>
        <RoadmapVisual />
      </Chapter>

      <Closing />
    </>
  );
}
