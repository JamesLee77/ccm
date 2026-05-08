import { useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import { PhaseTrack, PhaseDetail } from "./roadmap/PhaseTrack";
import DeliveryGantt from "./roadmap/DeliveryGantt";
import MilestoneList from "./roadmap/MilestoneList";
import LiveProgress from "./roadmap/LiveProgress";

export default function Roadmap() {
  const { t } = useTranslation("earth");
  const [active, setActive] = useState<string>("p1");

  return (
    <Section id="roadmap">
      <SectionLabel>{t("roadmap.label")}</SectionLabel>
      <Heading
        pre={t("roadmap.h1Pre")}
        em={t("roadmap.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <p
        className="font-body text-ink-soft mb-12"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("roadmap.lead")}
      </p>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("roadmap.trackLabel")}
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <PhaseTrack active={active} onActive={setActive} />
        <PhaseDetail active={active} />
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("roadmap.ganttLabel")}
      </div>
      <DeliveryGantt />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("roadmap.milestonesLabel")}
      </div>
      <MilestoneList />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("roadmap.progressLabel")}
      </div>
      <LiveProgress />
    </Section>
  );
}
