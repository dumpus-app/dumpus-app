import DailySentMessages from "./_components/DailySentMessages";
import PageHeader from "./_components/PageHeader";
import SendingTimes from "./_components/SendingTimes";
import TopChannels from "./_components/TopChannels";
import TopDMs from "./_components/TopDMs";
import TopGuilds from "./_components/TopGuilds";
import UsageStats from "./_components/UsageStats";
import Profile from "./_components/Profile";
import Share from "./_components/Share";

export default function Page() {
  return (
    <>
      <PageHeader />
      <Profile />
      <Share />
      <UsageStats />
      <TopDMs />
      <TopGuilds />
      <TopChannels />
      <SendingTimes />
      <DailySentMessages />
    </>
  );
}
