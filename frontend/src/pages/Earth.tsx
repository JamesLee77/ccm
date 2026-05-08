import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import NodeNetwork from "../components/brand/NodeNetwork";
import PageSection, { PageHero } from "../components/site/PageSection";

const PILLARS = ["measure", "verify", "retire"] as const;

export default function Earth() {
  const { t } = useTranslation("earth");
  return (
    <>
      <PageHero
        pre={t("h1Pre")}
        em={t("h1Em")}
        lead={t("lead")}
        right={<NodeNetwork count={9} size={320} />}
      />
      <PageSection className="pt-0">
        <div className="flex gap-3 mb-16">
          <Link
            to="/markets"
            className="font-mono text-[12px] tracking-[0.14em] uppercase px-5 py-3 bg-ink text-paper hover:bg-moss transition-colors"
          >
            {t("ctaApp")} ↗
          </Link>
          <Link
            to="/whitepaper"
            className="font-mono text-[12px] tracking-[0.14em] uppercase px-5 py-3 border border-rule text-ink hover:border-moss hover:text-moss transition-colors"
          >
            {t("ctaPaper")}
          </Link>
        </div>
      </PageSection>

      <PageSection label="three pillars">
        <div className="grid grid-cols-3 gap-12">
          {PILLARS.map((p) => (
            <div key={p}>
              <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3.5">
                {t(`pillars.${p}.label`)}
              </div>
              <h3
                className="font-display mb-3"
                style={{
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {t(`pillars.${p}.title`)}
              </h3>
              <p
                className="font-body text-ink-soft"
                style={{ fontSize: 18, lineHeight: 1.6 }}
              >
                {t(`pillars.${p}.body`)}
              </p>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
