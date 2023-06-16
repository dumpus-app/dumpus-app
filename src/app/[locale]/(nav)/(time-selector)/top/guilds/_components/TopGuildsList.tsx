"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";
import { useTopGuildsData } from "~/hooks/use-data";

export default function TopGuildsList() {
  const data = useTopGuildsData();

  return (
    <div className="grid gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8">
      {data.map((guild) => (
        <DetailCard.WithRank
          key={guild.rank}
          href={`/top/guilds/details?id=${guild.guild_id}`}
          rank={guild.rank}
          title={guild.guild_name}
          description={
            Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(guild.message_count) + " messages sent"
          }
          leftSlot={
            <div className="relative flex aspect-square w-10 items-center justify-center rounded-lg bg-brand-300 text-2xl font-bold uppercase text-gray-950">
              <div>{guild.guild_name[0]}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
