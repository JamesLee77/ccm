import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en"], // expand here when locales are translated (e.g. "ko", "ja")
    resources: {
      en: { translation: en.common, common: en.common, nav: en.nav, home: en.home,
            dashboard: en.dashboard, vesting: en.vesting, settings: en.settings, migrate: en.migrate },
    },
    ns: ["common", "nav", "home", "dashboard", "vesting", "settings", "migrate"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
