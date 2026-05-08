import { useTranslation } from "react-i18next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ThemeProvider from "../components/site/ThemeProvider";
import SiteNav from "../components/site/SiteNav";
import SiteFooter from "../components/site/SiteFooter";

function MarketsContent() {
  const { t } = useTranslation("markets");
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteNav />
      <main className="flex-1" style={{ padding: "120px 56px" }}>
        <div className="flex justify-between items-end mb-12">
          <h1
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            {t("h1")}
          </h1>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
        <p
          className="font-body text-ink-soft max-w-[680px]"
          style={{ fontSize: 18, lineHeight: 1.6 }}
        >
          {t("lead")}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * /markets — wallet-connected dashboard. Dark-only.
 */
export default function Markets() {
  return (
    <ThemeProvider force="dark">
      <MarketsContent />
    </ThemeProvider>
  );
}
