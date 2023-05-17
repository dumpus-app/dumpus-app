import TopGuildsList from "~/components/pages/top/guilds/TopGuildsList";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return <TopGuildsList />;
}
