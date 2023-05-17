import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "~/components/pages/top/guilds/Stats";
import TopUsedBots from "~/components/pages/top/guilds/TopUsedBots";
import TopChannels from "~/components/pages/top/guilds/TopChannels";
import FirstMessages from "~/components/pages/top/guilds/FirstMessages";
import DailySentMessages from "~/components/pages/top/guilds/DailySentMessages";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  const name = "Astro Lounge";

  return (
    <>
      <div className="mb-auto">
        <PageHeader title={name} />
        <ProfileHeader
          description="15k members"
          title={name}
          className="mb-auto"
          imageSlot={
            <div className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950">
              <div>{name[0]}</div>
            </div>
          }
        />
        <Stats />
        <TopUsedBots />
        <TopChannels />
        <FirstMessages />
        <DailySentMessages />
      </div>
    </>
  );
}
