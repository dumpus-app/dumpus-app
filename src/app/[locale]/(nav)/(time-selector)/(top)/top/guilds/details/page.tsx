"use client";

import PageHeader from "./_components/PageHeader";
import Stats from "./_components/Stats";
import TopUsedBots from "./_components/TopUsedBots";
import TopChannels from "./_components/TopChannels";
import FirstMessages from "./_components/FirstMessages";
import DailySentMessages from "./_components/DailySentMessages";
import { useSearchParams } from "next/navigation";
import { useDataSources } from "~/hooks/data/_shared";
import type { Guild } from "~/types/sql";
import Profile from "./_components/Profile";

// TODO: refactor
function useData(id: string) {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
    SELECT
      guild_name,
      guild_id,
      total_message_count
    FROM guilds
    WHERE guild_id = '${id}'
    LIMIT 1;
  `;

  const guild = resultAsList<Guild>(db.exec(query)[0])[0];

  return { guild };
}

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { guild } = useData(id);

  return (
    <>
      <PageHeader title={guild.guild_name} />
      <Profile guild={guild} />
      <Stats />
      <TopUsedBots />
      <TopChannels />
      <FirstMessages />
      <DailySentMessages />
    </>
  );
}
