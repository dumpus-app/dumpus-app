export const fallbackLocale = "en";
export const locales = [fallbackLocale, "fr"];

export function getOptions(locale = fallbackLocale) {
  return {
    // debug: true,
    supportedLngs: locales,
    fallbackLng: fallbackLocale,
    lng: locale,
  };
}
