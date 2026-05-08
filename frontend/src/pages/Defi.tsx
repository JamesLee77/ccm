import { useTranslation } from "react-i18next";
import SignalPlot from "../components/brand/SignalPlot";
import ThemeProvider from "../components/site/ThemeProvider";
import SiteNav from "../components/site/SiteNav";
import SiteFooter from "../components/site/SiteFooter";
import { PageHero } from "../components/site/PageSection";

function DefiContent() {
  const { t } = useTranslation("defi");
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteNav />
      <main className="flex-1">
        <PageHero
          pre={t("h1Pre")}
          em={t("h1Em")}
          lead={t("lead")}
          right={<SignalPlot w={520} h={140} />}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * /defi — DeFi-native landing. Dark-only by design (per handoff Markets/DeFi
 * pages). Wraps in ThemeProvider with force="dark" so the theme toggle is
 * disabled and the [data-theme] attribute is locked.
 */
export default function Defi() {
  return (
    <ThemeProvider force="dark">
      <DefiContent />
    </ThemeProvider>
  );
}
