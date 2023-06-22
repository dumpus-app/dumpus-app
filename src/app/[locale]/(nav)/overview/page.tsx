import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import DailySentMessages from "./_components/DailySentMessages";
import PageHeader from "./_components/PageHeader";
import SendingTimes from "./_components/SendingTimes";
import TopChannels from "./_components/TopChannels";
import TopDMs from "./_components/TopDMs";
import TopGuilds from "./_components/TopGuilds";
import UsageStats from "./_components/UsageStats";
import Profile from "./_components/Profile";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <Profile />
      <UsageStats />
      <TopDMs />
      <TopGuilds />
      <TopChannels />
      <SendingTimes />
      <DailySentMessages />
    </>
  );
}
