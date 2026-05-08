import i18n from "i18next";
import type { InitOptions, Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";

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
};

const options: InitOptions = {
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en"],
  resources,
  ns: [...NAMESPACES],
  defaultNS: "common",
  interpolation: { escapeValue: false },
};

void i18n.use(initReactI18next).init(options);

export default i18n;
