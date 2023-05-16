import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "~/components/Link";
import Header from "~/components/layout/Header";
import SendingTimes from "~/components/pages/overview/SendingTimes";
import TopChannels from "~/components/pages/overview/TopChannels";
import TopDMs from "~/components/pages/overview/TopDMs";
import TopGuilds from "~/components/pages/overview/TopGuilds";
import UsageStats from "~/components/pages/overview/UsageStats";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <div className="mb-auto">
        <Header
          rightSlot={
            <Link
              href="/settings"
              className="text-gray-400 transition-colors hover:text-gray-300"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </Link>
          }
        />
        <div className="flex items-center justify-between bg-gray-900 px-2 py-8">
          <div>
            <div className="text-gray-400">@florian-lefebvre</div>
            <div className="text-xl font-bold text-white">Florian Lefebvre</div>
          </div>
          <div className="relative h-16 w-16 shrink-0">
            <Image
              src="https://cdn.discordapp.com/embed/avatars/0.png"
              alt="Avatar"
              fill
              className="rounded-full object-cover object-center"
            />
          </div>
        </div>
      </div>
      <UsageStats />
      <TopDMs />
      <TopGuilds />
      <TopChannels />
      <SendingTimes />
    </>
  );
}
