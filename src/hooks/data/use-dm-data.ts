"use client";

import type { DmChannelsData } from "~/types/sql";
import { groupDays } from "./_chart";
import { topLocalHour, type DayHourCount } from "./_hours";
import { useDataSources } from "./_shared";

export default function useDMData({ userID }: { userID: string }) {
  const { sql, start, end } = useDataSources();

  // Whether the user is in the range's top DMs: a message to them in it.
  const hasData = !!sql.rows`
    SELECT 1 AS found
    FROM activity a
    WHERE a.event_name = 'message_sent'
    AND a.associated_channel_id IN (
      SELECT channel_id FROM dm_channels_data WHERE dm_user_id = '${userID}'
    )
    AND a.day BETWEEN '${start}' AND '${end}'
    LIMIT 1;
  `.data?.length;

  function getUser() {
    const { data, hasError } = sql<
      Pick<DmChannelsData, "user_name" | "user_avatar_url" | "dm_user_id">
    >`
      SELECT
          user_name,
          user_avatar_url,
          dm_user_id
      FROM dm_channels_data
      WHERE dm_user_id = '${userID}'
      LIMIT 1;
    `;

    return hasError ? null : data[0];
  }

  function getMessagesCount() {
    if (!hasData) return null;

    const { data, hasError } = sql<{ message_count: number }>`
      SELECT
          SUM(a.occurence_count) AS message_count
      FROM activity a
      JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      AND d.dm_user_id = '${userID}'
      GROUP BY d.dm_user_id
      LIMIT 1;
    `;

    return hasError ? null : data[0].message_count;
  }

  /** On the device's clock, see `localHours`. */
  function getTopChatHour() {
    if (!hasData) return null;

    const { data } = sql<DayHourCount>`
      SELECT a.day, a.hour, SUM(a.occurence_count) AS count
      FROM activity a
      WHERE a.event_name = 'message_sent'
      AND a.associated_channel_id IN (
        SELECT channel_id FROM dm_channels_data WHERE dm_user_id = '${userID}'
      )
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY a.day, a.hour;
    `;

    return topLocalHour(data);
  }

  function getDailySentMessages() {
    const { data, hasError } = sql.rows<{ day: string; count: number }>`
      SELECT a.day, SUM(a.occurence_count) AS count
      FROM activity a
      WHERE a.event_name = 'message_sent'
      AND a.associated_channel_id IN (
        SELECT channel_id FROM dm_channels_data WHERE dm_user_id = '${userID}'
      )
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY a.day;
    `;

    if (hasError) {
      return null;
    }

    return groupDays(start, end, data);
  }

  function getReactionsCount() {
    const { data, hasError } = sql<{ reaction_count: number }>`
      SELECT SUM(a.occurence_count) AS reaction_count
      FROM activity a
      JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
      WHERE a.event_name = 'add_reaction'
      AND d.dm_user_id = '${userID}'
      AND a.day BETWEEN '${start}' AND '${end}';
    `;

    return hasError ? null : data[0].reaction_count;
  }

  function getSentimentScore() {
    const { data, hasError } = sql<Pick<DmChannelsData, "sentiment_score">>`
      SELECT
        sentiment_score
      FROM dm_channels_data
      WHERE dm_user_id = '${userID}';
    `;

    return hasError ? null : data[0].sentiment_score;
  }

  return {
    hasData,
    user: getUser(),
    stats: {
      messagesCount: getMessagesCount(),
      topChatHour: getTopChatHour(),
      reactionsCount: getReactionsCount(),
    },
    sentimentScore: getSentimentScore(),
    dailySentMessages: getDailySentMessages(),
  };
}
