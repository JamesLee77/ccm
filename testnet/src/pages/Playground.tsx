import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import Section, { type SectionTone } from "../components/site/Section";
import SectionLabel from "../components/site/SectionLabel";
import Heading from "../components/site/Heading";
import ChapterRail from "../components/site/ChapterRail";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";
import MintForm from "../components/playground/MintForm";
import NFTInventory from "../components/playground/NFTInventory";
import WrapForm from "../components/playground/WrapForm";
import StakeForm from "../components/playground/StakeForm";
import RewardPanel from "../components/playground/RewardPanel";
import SwapForm from "../components/playground/SwapForm";
import TryMoreGrid from "../components/playground/TryMoreGrid";
import NodeRegistrationCallout from "../components/playground/NodeRegistrationCallout";
import HeroBanner from "../components/marketing/HeroBanner";
import LiveNetworkState from "../components/marketing/LiveNetworkState";
import MiningNetworkViz from "../components/marketing/MiningNetworkViz";
import MiningTimeline from "../components/marketing/MiningTimeline";
import OracleConsensusPanel from "../components/marketing/OracleConsensusPanel";
import OraclePriceHistory from "../components/marketing/OraclePriceHistory";
import YieldCurvePanel from "../components/marketing/YieldCurvePanel";
import ActivityFeed from "../components/marketing/ActivityFeed";

type ChapterId = "network" | "oracle" | "yield" | "activity" | "playground";

const CHAPTERS: { id: ChapterId; index: string; tone: SectionTone }[] = [
  { id: "network", index: "02", tone: "deep" },
  { id: "oracle", index: "03", tone: "paper" },
  { id: "yield", index: "04", tone: "deep" },
  { id: "activity", index: "05", tone: "paper" },
  { id: "playground", index: "06", tone: "deep" },
];

function Chapter({
  id,
  index,
  tone,
  children,
}: {
  id: ChapterId;
  index: string;
  tone: SectionTone;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Section id={id} tone={tone}>
      <SectionLabel index={`§ ${index}`}>{t(`chapters.${id}.label`)}</SectionLabel>
      <Heading pre={t(`chapters.${id}.pre`)} em={t(`chapters.${id}.em`)} maxWidth={900} className="mt-8 mb-8" />
      <p className="font-body text-ink-soft mb-12" style={{ fontSize: 20, lineHeight: 1.5, maxWidth: 720 }}>
        {t(`chapters.${id}.lead`)}
      </p>
      {children}
    </Section>
  );
}

export default function Playground() {
  const { t } = useTranslation();
  const rail = [
    { id: "vision", label: t("chapters.vision.label") },
    ...CHAPTERS.map((c) => ({ id: c.id, label: t(`chapters.${c.id}.label`) })),
  ];
  const [network, oracle, yield_, activity, playground] = CHAPTERS as [
    (typeof CHAPTERS)[number],
    (typeof CHAPTERS)[number],
    (typeof CHAPTERS)[number],
    (typeof CHAPTERS)[number],
    (typeof CHAPTERS)[number],
  ];

  return (
    <TestnetLayout>
      <ChapterRail items={rail} />
      <HeroBanner />

      <Chapter {...network}>
        <LiveNetworkState />
        <MiningNetworkViz />
        <MiningTimeline />
      </Chapter>

      <Chapter {...oracle}>
        <OracleConsensusPanel />
        <OraclePriceHistory />
      </Chapter>

      <Chapter {...yield_}>
        <YieldCurvePanel />
      </Chapter>

      <Chapter {...activity}>
        <ActivityFeed />
        <NodeRegistrationCallout />
      </Chapter>

      <Chapter {...playground}>
        <WalletStatusBar />
        <section
          className="border border-rule"
          style={{ background: "var(--panel, var(--paper-deep))", padding: 24, margin: "32px 0" }}
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
            {t("needs.title")}
          </div>
          <ul className="font-body" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--ink)" }}>
            <li>· {t("needs.wallet")}</li>
            <li>· {t("needs.network")}</li>
            <li>
              · {t("needs.gas")}{" "}
              <a href="https://portal.cdp.coinbase.com/products/faucet" target="_blank" rel="noreferrer" className="text-moss hover:underline">
                {t("needs.faucet")}
              </a>
              .
            </li>
            <li>· {t("needs.time")}</li>
          </ul>
        </section>

        <StepCard step={1} title={t("step1.title")} subtitle={t("step1.subtitle")}>
          <MintForm />
          <NFTInventory />
        </StepCard>
        <StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
          <WrapForm />
        </StepCard>
        <StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
          <StakeForm />
        </StepCard>
        <StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
          <RewardPanel />
        </StepCard>
        <StepCard step={5} title={t("step5.title")} subtitle={t("step5.subtitle")}>
          <SwapForm />
        </StepCard>
        <TryMoreGrid />
      </Chapter>
    </TestnetLayout>
  );
}
