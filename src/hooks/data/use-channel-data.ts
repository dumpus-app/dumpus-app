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

    const { data, hasError } = sql<{
      hour: number;
      message_count: number;
    }>`
      SELECT
        hour, SUM(occurence_count) as occurence_count
      FROM
          activity a
      WHERE event_name = 'message_sent' 
      AND day BETWEEN '${start}' AND '${end}'
      AND associated_channel_id = '${channelId}'
      GROUP BY hour
      ORDER BY occurence_count DESC
      LIMIT 1;
    `;

    if (hasError) {
      return null;
    }

    return data[0].hour;
  }

  function getReactionsCount() {
    const { data, hasError } = sql<{ reaction_count: number }>`
      SELECT SUM(a.occurence_count) AS reaction_count
      FROM activity a
      WHERE a.event_name = 'add_reaction'
      AND a.associated_channel_id = '${channelId}'
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
    const totalDays = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.floor(totalDays / (1000 * 60 * 60 * 24));

    const periodLength = days > 360 ? 30 : days > 90 ? 7 : 1;

    const { data, hasError } = sql<{
      period_start: string;
      message_count: number;
    }>`
      WITH RECURSIVE dates(day, day_group) AS (
        VALUES('${start}', 1)
        UNION ALL
        SELECT date(day, '+1 day'), 
        CASE WHEN (julianday(date(day, '+1 day')) - julianday('${start}')) % ${periodLength} = 0 THEN day_group + 1 ELSE day_group END
        FROM dates
        WHERE day < date('${start}', '+${days} days')
      )
      SELECT 
        MIN(dates.day) as period_start,
        MAX(dates.day) as period_end,
        IFNULL(SUM(joined_data.occurence_count),0) AS message_count
      FROM 
        dates
      LEFT JOIN 
        (SELECT a.day, a.occurence_count
        FROM activity a
        WHERE a.event_name = 'message_sent' AND a.associated_channel_id = '${channelId}'
        ) AS joined_data
        ON dates.day = joined_data.day 
      GROUP BY 
        day_group
      ORDER BY 
        period_start ASC;
      `;

    if (hasError) {
      return null;
    }

    return data.map(({ period_start, message_count }) => ({
      label: period_start,
      value: message_count,
    }));
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
