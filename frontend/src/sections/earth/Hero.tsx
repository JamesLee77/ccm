import { useTranslation } from "react-i18next";
import Heading from "../../components/site/Heading";
import AtmosphericTimeline from "./hero/AtmosphericTimeline";
import WhyNow from "./hero/WhyNow";
import NetworkSnapshot from "./hero/NetworkSnapshot";

export default function Hero() {
  const { t } = useTranslation("earth");
  return (
    <section
      id="vision"
      style={{ padding: "120px 56px 96px", position: "relative" }}
    >
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-20">
        {t("hero.meta")}
      </div>
      <div
        className="grid items-end"
        style={{ gridTemplateColumns: "1.4fr 1fr", gap: 80 }}
      >
        <div>
          <Heading as="h1" pre={t("hero.h1Pre")} em={t("hero.h1Em")} />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 22, lineHeight: 1.5, maxWidth: 560 }}
          >
            {t("hero.lead")}
          </p>
          <div className="flex gap-3 mt-12">
            <a
              href="#manifesto"
              className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
            >
              {t("hero.ctaPaper")}
            </a>
          </div>
        </div>

        <div
          className="border border-rule"
          style={{ background: "var(--paper-deep)", padding: 32 }}
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-4">
            {t("hero.readout.label")}
          </div>
          <div
            className="font-display text-ink"
            style={{
              fontSize: 84,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {t("hero.readout.ppm")}
            <span className="font-mono text-ink-soft" style={{ fontSize: 18, marginLeft: 10 }}>
              ppm
            </span>
          </div>
          <div
            className="font-body italic text-ink-soft mt-2 mb-8"
            style={{ fontSize: 15 }}
          >
            {t("hero.readout.ppmCaption")}
          </div>
          <div
            className="border-t border-rule pt-5"
          >
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
              {t("hero.readout.cumulative")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-display text-ink" style={{ fontSize: 36 }}>
                  {t("hero.readout.minted")}
                </div>
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
                  {t("hero.readout.mintedLabel")}
                </div>
              </div>
              <div>
                <div className="font-display text-moss" style={{ fontSize: 36 }}>
                  {t("hero.readout.retired")}
                </div>
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-soft mt-1">
                  {t("hero.readout.retiredLabel")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-24 pt-4 border-t border-rule flex justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
      >
        <span>{t("hero.scrollHint")}</span>
        <span>{t("hero.nextChapter")}</span>
      </div>

      {/* Atmospheric record */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-20">
        {t("hero.atmosphericLabel")}
      </div>
      <AtmosphericTimeline />

      {/* Why now */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("hero.whyNowLabel")}
      </div>
      <WhyNow />

      {/* Network snapshot */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("hero.snapshotLabel")}
      </div>
      <NetworkSnapshot />
    </section>
  );
}
