import { locales } from "./_locales";

export const fallbackLocale = "en";

export function getOptions(locale = fallbackLocale) {
  return {
    supportedLngs: [fallbackLocale, locales],
    fallbackLng: fallbackLocale,
    lng: locale,
  };
}
