import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Section from "../../components/site/Section";
import PathwayCards from "./manifesto/PathwayCards";
import DocumentsLibrary from "./manifesto/DocumentsLibrary";
import CommunityLive from "./manifesto/CommunityLive";
import ContactPanel from "./manifesto/ContactPanel";

export default function Manifesto() {
  const { t } = useTranslation("earth");
  return (
    <Section id="manifesto" style={{ padding: "120px 56px 96px" }}>
      {/* Big closing quote — the rhetorical centerpiece */}
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
        <Link
          to="/whitepaper"
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-4 bg-ink text-paper hover:bg-moss transition-colors"
        >
          {t("manifesto.ctaPaper")} →
        </Link>
      </div>

      {/* Pathways — what to do next, by audience */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-20">
        {t("manifesto.pathwaysLabel")}
      </div>
      <PathwayCards />

      {/* Documents library */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("manifesto.documentsLabel")}
      </div>
      <DocumentsLibrary />

      {/* Community pulse */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("manifesto.communityLabel")}
      </div>
      <CommunityLive />

      {/* Contact + newsletter */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("manifesto.contactLabel")}
      </div>
      <ContactPanel />
    </Section>
  );
}
