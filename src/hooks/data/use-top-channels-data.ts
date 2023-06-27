"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild, GuildChannelsData } from "~/types/sql";

export default function useTopChannelsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const { count } = resultAsList<{ count: number }>(
    db.exec(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          channel_name,
          channel_id,
          c.guild_id,
          g.guild_name,
          SUM(a.occurence_count) AS message_count    
        FROM guild_channels_data c
        JOIN activity a
          ON a.associated_channel_id = c.channel_id
        JOIN guilds g
          ON g.guild_id = c.guild_id
        WHERE a.event_name = 'message_sent'
        AND a.day BETWEEN '${start}' AND '${end}'
        GROUP BY channel_id
      ) subquery;
  `)[0]
  )[0];

  function getData({ offset = 0 }: { offset?: number | false }) {
    const query = `
    SELECT
      channel_name,
      channel_id,
      c.guild_id,
      g.guild_name,
      SUM(a.occurence_count) AS message_count    
    FROM guild_channels_data c
    JOIN activity a
      ON a.associated_channel_id = c.channel_id
    JOIN guilds g
      ON g.guild_id = c.guild_id
    WHERE a.event_name = 'message_sent'
    AND a.day BETWEEN '${start}' AND '${end}'
    GROUP BY channel_id
    ORDER BY message_count DESC
    ${
      offset === false
        ? ""
        : `LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)}`
    };
  `;

    const data = resultAsList<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
        Pick<Guild, "guild_name"> & {
          message_count: number;
        }
    >(db.exec(query)[0]).map((channel, i) => ({
      ...channel,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));

    return data;
  }

  return { getData, count };
}
