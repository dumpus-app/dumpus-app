"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";
import { useTopChannelsData } from "~/hooks/use-data";

export default function TopChannelsList() {
  const data = useTopChannelsData();

  return (
    <div className="grid gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8">
      {data.map((channel) => (
        <DetailCard.WithRank
          key={channel.rank}
          href={`/top/channels/details?guild_id=${channel.guild_id}&channel_id=${channel.channel_id}`}
          rank={channel.rank}
          title={"#" + channel.channel_name}
          description={`${channel.guild_name} · ${Intl.NumberFormat(
            i18next.language,
            {
              notation: "compact",
            }
          ).format(channel.message_count)} messages sent`}
          leftSlot={
            <div className="relative flex aspect-square w-10 items-center justify-center rounded-lg bg-brand-300 text-2xl font-bold uppercase text-gray-950">
              <div>{channel.channel_name[0]}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
