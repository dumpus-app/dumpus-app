"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild } from "~/types/sql";

export default function useTopGuildsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const { count } = resultAsList<{ count: number }>(
    db.exec(`
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
  `)[0]
  )[0];

  function getData({ offset = 0 }: { offset?: number }) {
    const query = `
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
    LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)};
  `;
    const data = resultAsList<
      Pick<Guild, "guild_name" | "guild_id"> & { message_count: number }
    >(db.exec(query)[0]).map((guild, i) => ({
      ...guild,
      rank: sqlOffset(offset) + i + 1,
    }));

    return data;
  }

  return { getData, count };
}
