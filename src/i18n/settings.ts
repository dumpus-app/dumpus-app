import { _locales } from "./_locales";

export const fallbackLocale = "en";
export const locales = [fallbackLocale, ..._locales];

export function getOptions(locale = fallbackLocale) {
  return {
    supportedLngs: locales,
    fallbackLng: fallbackLocale,
    lng: locale,
  };
}
