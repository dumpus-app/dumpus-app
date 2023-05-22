import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import Stats from "~/components/pages/stats/Stats";
import SendingTimes from "~/components/pages/stats/SendingTimes";
import DailySentMessages from "~/components/pages/stats/DailySentMessages";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="mb-auto">
      <PageHeader />
      <Stats />
      <SendingTimes />
      <DailySentMessages />
      <Stats />
    </div>
  );
}
