"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { DmChannelsData } from "~/types/sql";

type Row = Pick<
  DmChannelsData,
  "dm_user_id" | "user_name" | "user_avatar_url" | "channel_id"
> & { message_count: number; total?: number };

export default function useTopDMsData() {
  const { sql, start, end } = useDataSources();

  /**
   * One page of the list, or all of it with `false`. Ties go by user id, so
   * pages never overlap, and the first page also counts the whole list.
   */
  function page(offset: number | false) {
    return sql.rows<Row>`
      SELECT
        d.dm_user_id,
        d.user_name,
        d.user_avatar_url,
        SUM(a.occurence_count) AS message_count,
        d.channel_id${offset === 0 ? ", COUNT(*) OVER () AS total" : ""}
      FROM activity a
      JOIN dm_channels_data d
        ON a.associated_channel_id = d.channel_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY d.dm_user_id
      ORDER BY message_count DESC, d.dm_user_id
      ${
        offset === false
          ? ""
          : `LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)}`
      };
    `;
  }

  function getData({ offset = 0 }: { offset?: number | false }) {
    const { data } = page(offset);

    if (!data?.length) {
      return null;
    }

    return data.map(({ total, ...dm }, i) => ({
      ...dm,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  const { data: firstPage } = page(0);
  const count = firstPage ? (firstPage[0]?.total ?? 0) : null;

  return { getData, count };
}
