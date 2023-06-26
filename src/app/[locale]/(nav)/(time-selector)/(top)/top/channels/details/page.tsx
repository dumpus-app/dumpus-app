"use client";

import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import RelatedGuild from "./_components/RelatedGuild";
import Stats from "./_components/Stats";
import DailySentMessages from "./_components/DailySentMessages";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { useSearchParams } from "next/navigation";
import { useDataSources } from "~/hooks/data/_shared";
import type { Guild, GuildChannelsData } from "~/types/sql";
import { iconColor } from "~/utils/discord";

// TODO: refactor
function useData({
  guildId,
  channelId,
}: {
  guildId: string;
  channelId: string;
}) {
  const { db, resultAsList, start, end } = useDataSources();

  let query = `
    SELECT
      channel_name,
      channel_id 
    FROM guild_channels_data
    WHERE channel_id = '${channelId}'
    LIMIT 1;
  `;

  const channel = resultAsList<
    Pick<GuildChannelsData, "channel_name" | "channel_id">
  >(db.exec(query)[0])[0];

  query = `
    SELECT
      guild_name,
      guild_id,
      total_message_count
    FROM guilds
    WHERE guild_id = '${guildId}'
    LIMIT 1;
  `;

  const guild = resultAsList<Guild>(db.exec(query)[0])[0];

  return { channel, guild };
}

export default function Page() {
  const params = useSearchParams()!;
  const guildId = params.get("guild_id")!;
  const channelId = params.get("channel_id")!;

  const { channel, guild } = useData({ guildId, channelId });

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
      <Stats />
      <DailySentMessages />
    </>
  );
}
