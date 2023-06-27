"use client";

import { useDataSources } from "~/hooks/data/_shared";
import useTopChannelsData from "~/hooks/data/use-top-channels-data";
import type { Guild, GuildChannelsData } from "~/types/sql";

export default function useChannelData({
  guildId,
  channelId,
}: {
  guildId: string;
  channelId: string;
}) {
  const { sql, start, end } = useDataSources();
  const topChannelsData = useTopChannelsData().getData({ offset: false });

  const hasData = !!topChannelsData?.find(
    (channel) => channel.channel_id === channelId
  );

  function getChannel() {
    const { data, hasError } = sql<
      Pick<GuildChannelsData, "channel_name" | "channel_id">
    >`
      SELECT
        channel_name,
        channel_id 
      FROM guild_channels_data
      WHERE channel_id = '${channelId}'
      LIMIT 1;
    `;

    return hasError ? null : data[0];
  }

  function getGuild() {
    const { data, hasError } = sql<Guild>`
      SELECT
        guild_name,
        guild_id,
        total_message_count
      FROM guilds
      WHERE guild_id = '${guildId}'
      LIMIT 1;
    `;

    return hasError ? null : data[0];
  }

  function getMessagesCount() {
    if (!hasData) return null;

    const { data, hasError } = sql<{ message_count: number }>`
      SELECT
        SUM(a.occurence_count) AS message_count    
      FROM guild_channels_data c
      JOIN activity a
        ON a.associated_channel_id = c.channel_id
      WHERE a.event_name = 'message_sent'
      AND c.channel_id = '${channelId}'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY channel_id
      LIMIT 1;
    `;

    return hasError ? null : data[0].message_count;
  }

  function getInvitesCount() {
    // TODO: implement query
    const { data, hasError } = sql<{ invite_count: number }>``;

    return hasError ? null : data[0].invite_count;
  }

  function getTopChatHour() {
    if (!hasData) return null;

    // TODO: fix
    const { data, hasError } = sql<{
      hour: number;
      message_count: number;
    }>`
      SELECT
      d.channel_id,
        hour,
        SUM(a.occurence_count) AS message_count
      FROM 
        activity a
      JOIN dm_channels_data d
        ON d.channel_id = a.associated_channel_id
      WHERE event_name = 'message_sent' 
      AND day BETWEEN '${start}' AND '${end}'
      AND d.channel_id = '${channelId}'
      GROUP BY hour
      LIMIT 1
    `;

    if (hasError) {
      return null;
    }

    return data[0].hour;

    // TODO: format
    // return new Intl.DateTimeFormat(i18next.language, {
    //   hour: "numeric",
    // }).format(
    //   (() => {
    //     const date = new Date();
    //     // date.setHours(hour);
    //     return date;
    //   })()
    // );
  }

  function getReactionsCount() {
    // TODO: implement query
    const { data, hasError } = sql<{ reaction_count: number }>``;

    return hasError ? null : data[0].reaction_count;
  }

  function getChannelOpenings() {
    // TODO: implement query
    const { data, hasError } = sql<{ opening_count: number }>``;

    return hasError ? null : data[0].opening_count;
  }

  function getDailySentMessages() {
    // TODO: implement query
    const { data, hasError } = sql<{ message_count: number }>``;

    return hasError ? null : [];
  }

  return {
    hasData,
    channel: getChannel(),
    guild: getGuild(),
    stats: {
      messagesCount: getMessagesCount(),
      invitesCount: getInvitesCount(),
      topChatHour: getTopChatHour(),
      reactionsCount: getReactionsCount(),
      channelOpenings: getChannelOpenings(),
    },
    dailySentMessages: getDailySentMessages(),
  };
}
