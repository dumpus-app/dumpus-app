import { _locales } from "./_locales";

export const locales = _locales;

export const fallbackLocale = "en";

export function getOptions(locale = fallbackLocale) {
  return {
    supportedLngs: [fallbackLocale, locales],
    fallbackLng: fallbackLocale,
    lng: locale,
  };
}
