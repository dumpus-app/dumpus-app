import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import Stats from "./_components/Stats";
import SendingTimes from "./_components/SendingTimes";
import DailySentMessages from "./_components/DailySentMessages";

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
