import Image from "next/image";
import DailySentMessages from "~/components/pages/overview/DailySentMessages";
import SendingTimes from "~/components/pages/overview/SendingTimes";
import TopChannels from "~/components/pages/overview/TopChannels";
import TopDMs from "~/components/pages/overview/TopDMs";
import TopGuilds from "~/components/pages/overview/TopGuilds";
import UsageStats from "~/components/pages/overview/UsageStats";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Share from "~/components/pages/overview/Share";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <ProfileHeader
        description="@florian-lefebvre"
        title="Florian Lefebvre"
        className="mb-auto"
        imageSlot={
          <div className="relative h-16 w-16">
            <Image
              src="https://cdn.discordapp.com/embed/avatars/0.png"
              alt="Avatar"
              fill
              priority
              className="rounded-full object-cover object-center"
            />
          </div>
        }
      />
      <UsageStats />
      <TopDMs />
      <TopGuilds />
      <TopChannels />
      <SendingTimes />
      <DailySentMessages />
      <Share />
    </>
  );
}
