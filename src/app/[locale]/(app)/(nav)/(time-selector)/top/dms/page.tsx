import TopDMsList from "./_components/TopDmsList";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return <TopDMsList />;
}
