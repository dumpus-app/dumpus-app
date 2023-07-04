"use client";

import { useSearchParams } from "next/navigation";
import useGuildData from "~/hooks/data/use-guild-data";
import DailySentMessages from "./_components/DailySentMessages";
// import FirstMessages from "./_components/FirstMessages";
import PageHeader from "./_components/PageHeader";
import Profile from "./_components/Profile";
import Stats from "./_components/Stats";
import TopChannels from "./_components/TopChannels";
import TopUsedBots from "./_components/TopUsedBots";
import NoDataAvailable from "~/components/NoDataAvailable";
import NotFoundState from "~/components/NotFoundState";
import { formatHour, formatNumber } from "~/utils/format";

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { hasData, guild, stats, topBots, topChannels, dailySentMessages } =
    useGuildData({
      guildID: id,
    });

  if (!guild) return <NotFoundState />;

  const discordLink = `https://discord.com/guilds/${guild.guild_id}`;

  return (
    <>
      <PageHeader title={guild.guild_name} discordLink={discordLink} />
      <Profile guild={guild} discordLink={discordLink} />
      {hasData ? (
        <>
          <Stats
            messagesCount={formatNumber(stats.messagesCount, {
              notation: "standard",
            })}
            invitesCount={formatNumber(stats.invitesCount, {
              notation: "standard",
            })}
            joinsCount={formatNumber(stats.joinsCount, {
              notation: "standard",
            })}
            topChatHour={formatHour(stats.topChatHour)}
          />
          {/* TODO: handle no data */}
          <TopUsedBots bots={topBots || []} />
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
