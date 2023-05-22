import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "./_components/Stats";
import TopUsedBots from "./_components/TopUsedBots";
import TopChannels from "./_components/TopChannels";
import FirstMessages from "./_components/FirstMessages";
import DailySentMessages from "./_components/DailySentMessages";

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
