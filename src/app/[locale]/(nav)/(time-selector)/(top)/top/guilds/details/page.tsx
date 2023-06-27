"use client";

import { useSearchParams } from "next/navigation";
import useGuildData from "~/hooks/data/use-guild-data";
import DailySentMessages from "./_components/DailySentMessages";
import FirstMessages from "./_components/FirstMessages";
import PageHeader from "./_components/PageHeader";
import Profile from "./_components/Profile";
import Stats from "./_components/Stats";
import TopChannels from "./_components/TopChannels";
import TopUsedBots from "./_components/TopUsedBots";
import NoDataAvailable from "~/components/NoDataAvailable";

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { hasData, guild, stats, topBots } = useGuildData({ guildID: id });

  return (
    <>
      <PageHeader title={guild.guild_name} />
      <Profile guild={guild} />
      {hasData ? (
        <>
          <Stats
            messagesCount={stats.messagesCount || "N/A"}
            invitesCount={stats.invitesCount || "N/A"}
            joinsCount={stats.joinsCount || "N/A"}
            topChatHour={stats.topChatHour || "N/A"}
          />
          <TopUsedBots bots={topBots} />
          <TopChannels />
          <FirstMessages />
          <DailySentMessages />
        </>
      ) : (
        <NoDataAvailable />
      )}
    </>
  );
}
