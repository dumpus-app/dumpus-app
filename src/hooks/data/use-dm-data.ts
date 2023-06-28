"use client";

import type { DmChannelsData } from "~/types/sql";
import { useDataSources } from "./_shared";
import useTopDMsData from "~/hooks/data/use-top-dms-data";

export default function useDMData({ userID }: { userID: string }) {
  const { sql, start, end } = useDataSources();
  // TODO: only return ids
  const topDMsData = useTopDMsData().getData({ offset: false });

  const hasData = !!topDMsData?.find((dm) => dm.dm_user_id === userID);

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

  function getTopChatHour() {
    if (!hasData) return null;

    const { data, hasError } = sql<{
      hour: number;
      message_count: number;
    }>`
      SELECT hour,
        SUM(a.occurence_count) AS message_count
      FROM 
        activity a
      JOIN dm_channels_data d
        ON d.channel_id = a.associated_channel_id
      WHERE event_name = 'message_sent' 
      AND day BETWEEN '${start}' AND '${end}'
      AND d.dm_user_id = '${userID}'
      GROUP BY hour
      ORDER BY occurence_count DESC
      LIMIT 1
    `;

    return hasError ? null : data[0].hour;
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
        JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
        WHERE a.event_name = 'message_sent' AND d.dm_user_id = '${userID}'
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

  function getReactionsCount() {
    // TODO: implement query
    const { data, hasError } = sql<{ reaction_count: number }>``;

    return hasError ? null : data[0].reaction_count;
  }

  return {
    hasData,
    user: getUser(),
    stats: {
      messagesCount: getMessagesCount(),
      topChatHour: getTopChatHour(),
      reactionsCount: getReactionsCount(),
    },
    dailySentMessages: getDailySentMessages(),
  };
}
