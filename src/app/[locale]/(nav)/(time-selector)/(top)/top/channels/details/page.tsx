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
import NoDataAvailable from "~/components/NoDataAvailable";
import NotFoundState from "~/components/NotFoundState";
import { formatHour, formatNumber } from "~/utils/format";
import { firstCharFromUnicode } from "~/utils";

export default function Page() {
  const params = useSearchParams()!;
  const guildId = params.get("guild_id")!;
  const channelId = params.get("channel_id")!;

  const { hasData, channel, guild, stats, dailySentMessages } = useChannelData({
    guildId,
    channelId,
  });

  if (!channel || !guild) return <NotFoundState />;

  const discordLink = `discord://discord.com/channels/${guild.guild_id}/${channel.channel_id}`;

  return (
    <>
      <PageHeader
        title={"#" + channel.channel_name}
        discordLink={discordLink}
      />
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
            <div>{firstCharFromUnicode(channel.channel_name)}</div>
          </div>
        }
      >
        <Header.Icon
          href={discordLink}
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
            messagesCount={formatNumber(stats.messagesCount, {
              notation: "standard",
            })}
            invitesCount={formatNumber(stats.invitesCount, {
              notation: "standard",
            })}
            topChatHour={formatHour(stats.topChatHour)}
            reactionsCount={formatNumber(stats.reactionsCount, {
              notation: "standard",
            })}
            channelOpenings={formatNumber(stats.channelOpenings, {
              notation: "standard",
            })}
          />
          <DailySentMessages data={dailySentMessages || []} />
        </>
      ) : (
        <NoDataAvailable />
      )}
    </>
  );
}
