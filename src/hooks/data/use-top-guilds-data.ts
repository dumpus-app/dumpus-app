"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild } from "~/types/sql";

export default function useTopGuildsData() {
  const { sql, start, end } = useDataSources();

  function getCount() {
    const { data, hasError } = sql<{ count: number }>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          guild_name,
          guild_id,
          SUM(a.occurence_count) AS message_count
        FROM guilds
        JOIN activity a
          ON a.associated_guild_id = guilds.guild_id
        WHERE a.event_name = 'message_sent'
        AND a.day BETWEEN '${start}' AND '${end}'
        GROUP BY guild_id
      ) subquery;
    `;

    const count = hasError ? null : data[0].count;

    return count;
  }

  function getData({ offset = 0 }: { offset?: number | false }) {
    const { data, hasError } = sql<
      Pick<Guild, "guild_name" | "guild_id"> & { message_count: number }
    >`
      SELECT
        guild_name,
        guild_id,
        SUM(a.occurence_count) AS message_count
      FROM guilds
      JOIN activity a
        ON a.associated_guild_id = guilds.guild_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY guild_id
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

    return data.map((guild, i) => ({
      ...guild,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  return { getData, count: getCount() };
}
