import { useTranslation } from "~/i18n";
import type { PageProps } from "~/types";

export default async function Home({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);
  return (
    <div>
      <h1 className="text-2xl">{t("home")}</h1>
      <h2>Locale: {locale}</h2>
    </div>
  );
}
