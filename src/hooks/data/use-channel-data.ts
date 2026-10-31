"use client";

import { groupDays } from "~/hooks/data/_chart";
import { topLocalHour, type DayHourCount } from "~/hooks/data/_hours";
import { useDataSources } from "~/hooks/data/_shared";
import type { Guild, GuildChannelsData } from "~/types/sql";

export default function useChannelData({ channelID }: { channelID: string }) {
  const { sql, start, end } = useDataSources();

  // Whether the channel is in the range's top channels: a message in it.
  const hasData = !!sql.rows`
    SELECT 1 AS found
    FROM guild_channels_data c
    JOIN guilds g ON g.guild_id = c.guild_id
    JOIN activity a ON a.associated_channel_id = c.channel_id
    WHERE c.channel_id = '${channelID}'
    AND a.event_name = 'message_sent'
    AND a.day BETWEEN '${start}' AND '${end}'
    LIMIT 1;
  `.data?.length;

  function getChannel() {
    const { data, hasError } = sql<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id">
    >`
      SELECT
        channel_name,
        channel_id,
        guild_id
      FROM guild_channels_data
      WHERE channel_id = '${channelID}'
      LIMIT 1;
    `;

    return hasError ? null : data[0];
  }

  function getGuild(guildID: string) {
    const { data, hasError } = sql<Guild>`
      SELECT
        guild_name,
        guild_id,
        total_message_count
      FROM guilds
      WHERE guild_id = '${guildID}'
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
      AND c.channel_id = '${channelID}'
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

  /** On the device's clock, see `localHours`. */
  function getTopChatHour() {
    if (!hasData) return null;

    const { data } = sql<DayHourCount>`
      SELECT day, hour, SUM(occurence_count) AS count
      FROM activity
      WHERE event_name = 'message_sent'
      AND associated_channel_id = '${channelID}'
      AND day BETWEEN '${start}' AND '${end}'
      GROUP BY day, hour;
    `;

    return topLocalHour(data);
  }

  function getReactionsCount() {
    const { data, hasError } = sql<{ reaction_count: number }>`
      SELECT SUM(a.occurence_count) AS reaction_count
      FROM activity a
      WHERE a.event_name = 'add_reaction'
      AND a.associated_channel_id = '${channelID}'
      AND a.day BETWEEN '${start}' AND '${end}';
    `;

    return hasError ? null : data[0].reaction_count;
  }

  function getChannelOpenings() {
    // TODO: implement query
    const { data, hasError } = sql<{ opening_count: number }>``;

    return hasError ? null : data[0].opening_count;
  }

  function getDailySentMessages() {
    const { data, hasError } = sql.rows<{ day: string; count: number }>`
      SELECT a.day, SUM(a.occurence_count) AS count
      FROM activity a
      WHERE a.event_name = 'message_sent'
      AND a.associated_channel_id = '${channelID}'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY a.day;
    `;

    if (hasError) {
      return null;
    }

    return groupDays(start, end, data);
  }

  const channel = getChannel();

  return {
    hasData,
    channel,
    guild: getGuild(channel?.guild_id || ""),
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
