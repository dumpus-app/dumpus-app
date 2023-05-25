import Image from "next/image";
import DailySentMessages from "./_components/DailySentMessages";
import SendingTimes from "./_components/SendingTimes";
import TopChannels from "./_components/TopChannels";
import TopDMs from "./_components/TopDMs";
import TopGuilds from "./_components/TopGuilds";
import UsageStats from "./_components/UsageStats";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Button from "~/components/Button";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <ProfileHeader
        description="@florian-lefebvre"
        title="Florian Lefebvre"
        imageSlot={
          <div className="relative h-16 w-16 sm:h-32 sm:w-32">
            <Image
              src="https://cdn.discordapp.com/embed/avatars/0.png"
              alt="Avatar"
              fill
              priority
              className="rounded-full object-cover object-center"
            />
          </div>
        }
      >
        <Button className="absolute right-2 hidden sm:block">Share</Button>
      </ProfileHeader>
      <UsageStats />
      <TopDMs />
      <TopGuilds />
      <TopChannels />
      <SendingTimes />
      <DailySentMessages />
    </>
  );
}
