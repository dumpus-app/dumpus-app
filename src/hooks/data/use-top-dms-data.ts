"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { DmChannelsData } from "~/types/sql";

export default function useTopDMsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const { count } = resultAsList<{ count: number }>(
    db.exec(`
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
  `)[0]
  )[0];

  function getData({ offset = 0 }: { offset?: number }) {
    const query = `
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
    LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)};
  `;

    const data = resultAsList<
      Pick<
        DmChannelsData,
        "dm_user_id" | "user_name" | "user_avatar_url" | "channel_id"
      > & { message_count: number }
    >(db.exec(query)[0]).map((dm, i) => ({
      ...dm,
      rank: sqlOffset(offset) + i + 1,
    }));

    return data;
  }
  return { getData, count };
}
