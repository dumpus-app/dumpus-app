export const fallbackLocale = "en";
export const locales = [fallbackLocale, "fr"];
export const defaultNS = "translation";

export function getOptions(locale = fallbackLocale, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: locales,
    fallbackLng: fallbackLocale,
    lng: locale,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
