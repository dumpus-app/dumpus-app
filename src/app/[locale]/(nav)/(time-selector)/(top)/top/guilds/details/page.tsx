"use client";

import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "./_components/Stats";
import TopUsedBots from "./_components/TopUsedBots";
import TopChannels from "./_components/TopChannels";
import FirstMessages from "./_components/FirstMessages";
import DailySentMessages from "./_components/DailySentMessages";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { useSearchParams } from "next/navigation";
import { useDataSources } from "~/hooks/use-data";
import type { Guild } from "~/types/sql";

// TODO: refactor
function useData(id: string) {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
    SELECT
      guild_name,
      guild_id
    FROM guilds
    WHERE guild_id = '${id}'
    LIMIT 1;
  `;

  const guild = resultAsList<Omit<Guild, "total_message_count">>(
    db.exec(query)[0]
  )[0];

  return { guild };
}

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { guild } = useData(id);

  return (
    <>
      <PageHeader title={guild.guild_name} />
      <ProfileHeader
        description="todo"
        title={guild.guild_name}
        imageSlot={
          <div className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950 sm:h-32 sm:w-32 sm:text-6xl">
            <div>{guild.guild_name[0]}</div>
          </div>
        }
      >
        <Header.Icon
          href={`discord://discord.com/guilds/${guild.guild_id}`}
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
          className="absolute right-2 top-4 hidden sm:block"
        />
      </ProfileHeader>
      <Stats />
      <TopUsedBots />
      <TopChannels />
      <FirstMessages />
      <DailySentMessages />
    </>
  );
}
