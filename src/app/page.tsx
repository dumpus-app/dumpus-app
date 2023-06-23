import type { Metadata } from "next";
import { initI18next } from "~/i18n";
import { fallbackLocale } from "~/i18n/settings";
import { Redirect } from "~/i18n/redirect";
import { generateSEO } from "~/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const i18nextInstance = await initI18next(fallbackLocale);
  const t = i18nextInstance.getFixedT(fallbackLocale);

  const title = t("seo.title");
  const description = t("seo.description");

  return generateSEO({ title, description });
}

export default function Index() {
  return <Redirect />;
}
