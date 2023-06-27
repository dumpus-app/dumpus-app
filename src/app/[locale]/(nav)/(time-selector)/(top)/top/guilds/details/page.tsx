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

  const { hasData, guild, stats, topBots, topChannels, dailySentMessages } =
    useGuildData({
      guildID: id,
    });

  // TODO: handle 404. Make title and description customizable
  if (!guild) return <NoDataAvailable />;

  return (
    <>
      <PageHeader title={guild.guild_name} />
      <Profile guild={guild} />
      {hasData ? (
        <>
          <Stats
            // TODO: format
            messagesCount={stats.messagesCount?.toString() || "N/A"}
            invitesCount={stats.invitesCount?.toString() || "N/A"}
            joinsCount={stats.joinsCount?.toString() || "N/A"}
            topChatHour={stats.topChatHour?.toString() || "N/A"}
          />
          {/* TODO: handle no data */}
          <TopUsedBots bots={topBots || []} />
          {/* TODO: handle no data */}
          <TopChannels channels={topChannels || []} />
          {/* TODO: implement */}
          {/* <FirstMessages /> */}
          <DailySentMessages data={dailySentMessages || []} />
        </>
      ) : (
        <NoDataAvailable />
      )}
    </>
  );
}
