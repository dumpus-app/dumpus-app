"use client";

import { useSearchParams } from "next/navigation";
import ProfileHeader from "~/components/ProfileHeader";
import { SimpleIconsDiscord } from "~/components/icons";
import Header from "~/components/layout/Header";
import useChannelData from "~/hooks/data/use-channel-data";
import { iconColor } from "~/utils/discord";
import DailySentMessages from "./_components/DailySentMessages";
import PageHeader from "./_components/PageHeader";
import RelatedGuild from "./_components/RelatedGuild";
import Stats from "./_components/Stats";
import i18next from "i18next";
import NoDataAvailable from "~/components/NoDataAvailable";

export default function Page() {
  const params = useSearchParams()!;
  const guildId = params.get("guild_id")!;
  const channelId = params.get("channel_id")!;

  const { hasData, channel, guild, stats, dailySentMessages } = useChannelData({
    guildId,
    channelId,
  });

  return (
    <>
      <PageHeader title={"#" + channel.channel_name} />
      <ProfileHeader
        description={guild.guild_name}
        title={"#" + channel.channel_name}
        imageSlot={
          <div
            className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg text-4xl font-bold uppercase text-gray-950 sm:h-32 sm:w-32 sm:text-6xl"
            style={{
              backgroundColor: iconColor(guild.guild_id + channel.channel_id),
            }}
          >
            <div>{channel.channel_name[0]}</div>
          </div>
        }
      >
        <Header.Icon
          href={`discord://discord.com/channels/${guild.guild_id}/${channel.channel_id}`}
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
          className="absolute right-2 top-4 hidden sm:block"
        />
      </ProfileHeader>
      <RelatedGuild guild={guild} />
      {hasData ? (
        <>
          <Stats
            messageCount={Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(stats.messagesCount)}
            invitesCount={stats.invitesCount || "N/A"}
            topHour={stats.topChatHour || "N/A"}
            reactionCount={stats.reactionsCount || "N/A"}
            channelOpenings={stats.channelOpenings || "N/A"}
          />
          <DailySentMessages data={dailySentMessages || []} />
        </>
      ) : (
        <NoDataAvailable />
      )}
    </>
  );
}
