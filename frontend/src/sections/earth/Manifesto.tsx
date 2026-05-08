import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";

export default function Manifesto() {
  const { t } = useTranslation("earth");
  return (
    <Section id="manifesto" style={{ padding: "120px 56px 96px" }}>
      <div
        className="font-display text-ink"
        style={{
          fontWeight: 300,
          fontSize: "clamp(48px, 6vw, 96px)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          maxWidth: 1200,
        }}
      >
        {t("manifesto.h1")}
      </div>
      <div className="flex gap-3 mt-16">
        <a
          href="https://github.com/JamesLee77/ccm/blob/main/docs/CCM_Network_Whitepaper_v1.0.pdf"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
        >
          {t("manifesto.ctaPaper")} →
        </a>
        <a
          href="https://github.com/JamesLee77/ccm"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 border border-ink text-ink hover:border-moss hover:text-moss transition-colors"
        >
          {t("manifesto.ctaGithub")} ↗
        </a>
      </div>
    </Section>
  );
}
