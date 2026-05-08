import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

type Phase = {
  n: string;
  title: string;
  when: string;
  body: string;
  state: "done" | "current" | "planned";
};

export default function Roadmap() {
  const { t } = useTranslation("earth");
  const phases = t("roadmap.phases", { returnObjects: true }) as Phase[];
  return (
    <Section id="roadmap">
      <SectionLabel>{t("roadmap.label")}</SectionLabel>
      <Heading
        pre={t("roadmap.h1Pre")}
        em={t("roadmap.h1Em")}
        maxWidth={900}
        className="mt-8 mb-16"
      />
      <div className="relative">
        <div
          className="absolute left-0 right-0"
          style={{ top: 30, height: 1, background: "var(--rule)" }}
        />
        <div className="grid" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
          {phases.map((p) => {
            const dotBg =
              p.state === "done"
                ? "var(--moss)"
                : p.state === "current"
                  ? "var(--paper)"
                  : "var(--paper)";
            const dotBorder =
              p.state === "done"
                ? "var(--moss)"
                : p.state === "current"
                  ? "var(--ink)"
                  : "var(--rule)";
            return (
              <div key={p.n} className="pr-4 relative">
                <div
                  style={{
                    width: 14,
                    height: 14,
                    background: dotBg,
                    border: `2px solid ${dotBorder}`,
                    borderRadius: "50%",
                    marginBottom: 24,
                    marginLeft: -1,
                  }}
                />
                <div className="font-display italic text-moss" style={{ fontSize: 14 }}>
                  phase {p.n}
                </div>
                <div className="font-display text-ink mt-1" style={{ fontSize: 22 }}>
                  {p.title}
                </div>
                <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft mt-2">
                  {p.when}
                </div>
                <div
                  className="font-body text-ink-soft mt-2"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  {p.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
