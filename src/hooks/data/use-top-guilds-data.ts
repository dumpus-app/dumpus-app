"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild } from "~/types/sql";

type Row = Pick<Guild, "guild_name" | "guild_id"> & {
  message_count: number;
  total?: number;
};

export default function useTopGuildsData() {
  const { sql, start, end } = useDataSources();

  /**
   * One page of the list, or all of it with `false`. Ties go by guild id, so
   * pages never overlap, and the first page also counts the whole list.
   */
  function page(offset: number | false) {
    return sql.rows<Row>`
      SELECT
        guild_name,
        guild_id,
        SUM(a.occurence_count) AS message_count${offset === 0 ? ", COUNT(*) OVER () AS total" : ""}
      FROM guilds
      JOIN activity a
        ON a.associated_guild_id = guilds.guild_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY guild_id
      ORDER BY message_count DESC, guild_id
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

    return data.map(({ total, ...guild }, i) => ({
      ...guild,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  const { data: firstPage } = page(0);
  const count = firstPage ? (firstPage[0]?.total ?? 0) : null;

  return { getData, count };
}
