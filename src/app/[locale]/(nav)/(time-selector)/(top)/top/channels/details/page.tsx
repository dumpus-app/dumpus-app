import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import RelatedGuild from "~/components/pages/top/channels/RelatedGuild";
import Stats from "~/components/pages/top/channels/Stats";
import DailySentMessages from "~/components/pages/top/channels/DailySentMessages";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  const name = "#chat";

  return (
    <>
      <div className="mb-auto">
        <PageHeader title={name} />
        <ProfileHeader
          description="AndrozDev"
          title={name}
          className="mb-auto"
          imageSlot={
            <div className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950">
              <div>{name[1]}</div>
            </div>
          }
        />
        <RelatedGuild />
        <Stats />
        <DailySentMessages />
      </div>
    </>
  );
}
