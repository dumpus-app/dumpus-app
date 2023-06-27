"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { DmChannelsData } from "~/types/sql";

export default function useTopDMsData() {
  const { sql, start, end } = useDataSources();

  function getCount() {
    const { data, hasError } = sql<{ count: number }>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          d.dm_user_id,
          d.user_name,
          d.user_avatar_url,
          SUM(a.occurence_count) AS message_count,
          d.channel_id
        FROM activity a
        JOIN dm_channels_data d
          ON a.associated_channel_id = d.channel_id
        WHERE a.event_name = 'message_sent'
        AND a.day BETWEEN '${start}' AND '${end}'
        GROUP BY d.dm_user_id
      ) subquery;
    `;

    const count = hasError ? null : data[0].count;

    return count;
  }

  function getData({ offset = 0 }: { offset?: number | false }) {
    const { data, hasError } = sql<
      Pick<
        DmChannelsData,
        "dm_user_id" | "user_name" | "user_avatar_url" | "channel_id"
      > & { message_count: number }
    >`
      SELECT
        d.dm_user_id,
        d.user_name,
        d.user_avatar_url,
        SUM(a.occurence_count) AS message_count,
        d.channel_id
        FROM activity a
      JOIN dm_channels_data d
        ON a.associated_channel_id = d.channel_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY d.dm_user_id
      ORDER BY message_count DESC
      ${
        offset === false
          ? ""
          : `LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)}`
      };
    `;

    if (hasError) {
      return null;
    }

    return data.map((dm, i) => ({
      ...dm,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  return { getData, count: getCount() };
}
