"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild, GuildChannelsData } from "~/types/sql";

type Row = Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
  Pick<Guild, "guild_name"> & { message_count: number; total?: number };

export default function useTopChannelsData() {
  const { sql, start, end } = useDataSources();

  /**
   * One page of the list, or all of it with `false`. Ties go by channel id, so
   * pages never overlap, and the first page also counts the whole list.
   */
  function page(offset: number | false) {
    return sql.rows<Row>`
      SELECT
        channel_name,
        channel_id,
        c.guild_id,
        g.guild_name,
        SUM(a.occurence_count) AS message_count${offset === 0 ? ", COUNT(*) OVER () AS total" : ""}
      FROM guild_channels_data c
      JOIN activity a
        ON a.associated_channel_id = c.channel_id
      JOIN guilds g
        ON g.guild_id = c.guild_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY channel_id
      ORDER BY message_count DESC, channel_id
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

    return data.map(({ total, ...channel }, i) => ({
      ...channel,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  const { data: firstPage } = page(0);
  const count = firstPage ? (firstPage[0]?.total ?? 0) : null;

  return { getData, count };
}
