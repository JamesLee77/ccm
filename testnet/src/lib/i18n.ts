import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import ko from "../locales/ko.json";

const stored = typeof window !== "undefined" ? window.localStorage.getItem("ccm-testnet-lang") : null;
const initialLang = stored === "en" || stored === "ko" ? stored : "ko";

void i18n.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: "en",
  supportedLngs: ["ko", "en"],
  resources: { ko, en },
  interpolation: { escapeValue: false },
});

export default i18n;

export function setLang(lng: "ko" | "en") {
  void i18n.changeLanguage(lng);
  try { window.localStorage.setItem("ccm-testnet-lang", lng); } catch {}
}
