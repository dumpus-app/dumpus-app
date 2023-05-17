import Image from "next/image";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "~/components/pages/top/dms/Stats";
import DailySentMessages from "~/components/pages/top/dms/DailySentMessages";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  const name = "Androz";

  return (
    <>
      <div className="mb-auto">
        <PageHeader title={name} />
        <ProfileHeader
          description="@androz2091"
          title={name}
          className="mb-auto"
          imageSlot={
            <div className="relative h-16 w-16">
              <Image
                src="https://cdn.discordapp.com/embed/avatars/5.png"
                alt="Avatar"
                fill
                className="rounded-full object-cover object-center"
              />
            </div>
          }
        />
        <Stats />
        <DailySentMessages />
      </div>
    </>
  );
}
