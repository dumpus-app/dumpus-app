"use client";

import i18next from "i18next";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getOptions } from "./settings";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      // @ts-ignore
      (language, namespace) => import(`#root/locales/${language}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ["path", "localStorage", "navigator", "htmlTag"],
    },
  });

export function useTranslation(locale = i18next.language) {
  if (i18next.resolvedLanguage !== locale) i18next.changeLanguage(locale);
  return useTranslationOrg();
}
