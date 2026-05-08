import i18n from "i18next";
import type { InitOptions, Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import ko from "../locales/ko.json";

const NAMESPACES = [
  "common",
  "nav",
  "footer",
  "earth",
  "ccmine",
  "tokenomics",
  "roadmap",
  "whitepaper",
  "defi",
  "markets",
] as const;

type Bundle = Record<string, Record<string, unknown>>;

const resources: Resource = {
  en: en as Bundle,
  ko: ko as Bundle,
};

const options: InitOptions = {
  fallbackLng: "ko",
  supportedLngs: ["ko", "en"],
  resources,
  ns: [...NAMESPACES],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  detection: {
    order: ["localStorage", "navigator", "htmlTag"],
    lookupLocalStorage: "ccm-lang",
    caches: ["localStorage"],
  },
};

void i18n.use(LanguageDetector).use(initReactI18next).init(options);

export default i18n;
