import LanguageDetector from "next-language-detector";
import { fallbackLocale, locales } from "./settings";

export default LanguageDetector({
  supportedLngs: locales,
  fallbackLng: fallbackLocale,
});
