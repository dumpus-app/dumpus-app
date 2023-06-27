"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { sqlOffset, useDataSources } from "./_shared";
import type { Guild, GuildChannelsData } from "~/types/sql";

export default function useTopChannelsData() {
  const { sql, start, end } = useDataSources();

  function getCount() {
    const { data, hasError } = sql<{ count: number }>`
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
    `;

    const count = hasError ? null : data[0].count;

    return count;
  }

  function getData({ offset = 0 }: { offset?: number | false }) {
    const { data, hasError } = sql<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
        Pick<Guild, "guild_name"> & {
          message_count: number;
        }
    >`
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

    if (hasError) {
      return null;
    }

    return data.map((channel, i) => ({
      ...channel,
      rank: (offset === false ? 0 : sqlOffset(offset)) + i + 1,
    }));
  }

  return { getData, count: getCount() };
}
