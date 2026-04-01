import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import ar from "./locales/ar";
import fr from "./locales/fr";
import es from "./locales/es";
import de from "./locales/de";
import pt from "./locales/pt";
import it from "./locales/it";
import tr from "./locales/tr";
import ru from "./locales/ru";
import zh from "./locales/zh";
import ja from "./locales/ja";
import ko from "./locales/ko";
import nl from "./locales/nl";
import fa from "./locales/fa";

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧", rtl: false },
  { code: "ar", name: "العربية", flag: "🇱🇧", rtl: true },
  { code: "fr", name: "Français", flag: "🇫🇷", rtl: false },
  { code: "es", name: "Español", flag: "🇪🇸", rtl: false },
  { code: "de", name: "Deutsch", flag: "🇩🇪", rtl: false },
  { code: "pt", name: "Português", flag: "🇵🇹", rtl: false },
  { code: "it", name: "Italiano", flag: "🇮🇹", rtl: false },
  { code: "tr", name: "Türkçe", flag: "🇹🇷", rtl: false },
  { code: "ru", name: "Русский", flag: "🇷🇺", rtl: false },
  { code: "zh", name: "中文", flag: "🇨🇳", rtl: false },
  { code: "ja", name: "日本語", flag: "🇯🇵", rtl: false },
  { code: "ko", name: "한국어", flag: "🇰🇷", rtl: false },
  { code: "nl", name: "Nederlands", flag: "🇳🇱", rtl: false },
  { code: "fa", name: "فارسی", flag: "🇮🇷", rtl: true },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      es: { translation: es },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
      tr: { translation: tr },
      ru: { translation: ru },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
      nl: { translation: nl },
      fa: { translation: fa },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18n-language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export function applyDirection(lng: string) {
  const lang = LANGUAGES.find((l) => l.code === lng);
  const dir = lang?.rtl ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
}

i18n.on("languageChanged", applyDirection);

applyDirection(i18n.language);

export default i18n;
