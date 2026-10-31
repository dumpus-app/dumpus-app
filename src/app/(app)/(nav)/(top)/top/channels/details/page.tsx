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
import Deferred from "~/components/Deferred";
import DetailsSkeleton from "~/components/DetailsSkeleton";
import PageEnter from "~/components/PageEnter";

export default function Page() {
  return (
    <Deferred
      fallback={<DetailsSkeleton header={<PageHeader title="" />} stats={4} />}
    >
      <PageEnter className="flex grow flex-col">
        <ChannelDetails />
      </PageEnter>
    </Deferred>
  );
}

function ChannelDetails() {
  const params = useSearchParams()!;
  const channelID = params.get("id")!;

  const { hasData, channel, guild, stats, dailySentMessages } = useChannelData({
    channelID,
  });

  if (!channel || !guild) return <NotFoundState />;

  const discordLink = `https://discord.com/channels/${guild.guild_id}/${channel.channel_id}`;

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
            className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg text-4xl font-bold text-gray-950 uppercase sm:h-32 sm:w-32 sm:text-6xl"
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
          icon={SimpleIconsDiscord}
          className="absolute top-4 right-2 hidden sm:block"
        />
      </ProfileHeader>
      <RelatedGuild guild={guild} channelID={channel.channel_id} />
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
