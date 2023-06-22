"use client";

import { useAtomValue } from "jotai";
import useSafeDB from "./use-safe-db";
import useSQL from "./use-sql";
import { timeRangeDates } from "~/stores/db";
import type { DmChannelsData, Guild, GuildChannelsData } from "~/types/sql";
import { SQL_DEFAULT_LIMIT } from "~/constants";
import i18next from "i18next";

function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  return { db, resultAsList, start, end };
}

export function useTopDMsData() {
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

export function useTopChannelsData() {
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
        GROUP BY channel_name
      ) subquery;
  `)[0]
  )[0];

  function getData({ offset = 0 }: { offset?: number }) {
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
    GROUP BY channel_name
    ORDER BY message_count DESC
    LIMIT ${SQL_DEFAULT_LIMIT} OFFSET ${sqlOffset(offset)};
  `;

    const data = resultAsList<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
        Pick<Guild, "guild_name"> & {
          message_count: number;
        }
    >(db.exec(query)[0]).map((channel, i) => ({
      ...channel,
      rank: sqlOffset(offset) + i + 1,
    }));

    return data;
  }

  return { getData, count };
}

export function useTopGuildsData() {
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
        GROUP BY guild_name
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
    GROUP BY guild_name
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

export function useSendingTimesData() {
  const chartData = [
    {
      label: "12 AM",
      value: 125,
    },
    {
      label: "3 AM",
      value: 2,
    },
    {
      label: "6 AM",
      value: 753,
    },
    {
      label: "9 AM",
      value: 1864,
    },
    {
      label: "12 PM",
      value: 1803,
    },
    {
      label: "3 PM",
      value: 475,
    },
    {
      label: "6 PM",
      value: 3574,
    },
    {
      label: "9 PM",
      value: 2756,
    },
  ];

  const statsData = [
    {
      value: "1h43",
      label: "average time spent per day",
    },
    {
      value: "15",
      label: "Discord app openings per day",
    },
  ];

  return { chartData, statsData };
}

export function useDailySentMessagesData() {
  const { db, resultAsList, start, end } = useDataSources();

  //   const query = `
  //     WITH RECURSIVE dates(day) AS (
  //   VALUES('${start}')
  //   UNION ALL
  //   SELECT date(day, '+1 day')
  //   FROM dates
  //   WHERE date(day, '+1 day') <= '${end}'
  // )
  // SELECT
  //     dates.day,
  //     IFNULL(SUM(a.occurence_count),0) AS message_count
  // FROM
  //     dates
  // LEFT JOIN
  //     activity a ON dates.day = a.day
  //     AND a.event_name = 'message_sent'
  // GROUP BY
  //     dates.day
  // ORDER BY
  //     dates.day ASC;
  //   `;

  const query = `
WITH RECURSIVE months(month) AS (
  VALUES('${start}')
  UNION ALL
  SELECT date(month, '+1 month')
  FROM months
  WHERE date(month, '+1 month') <= '${end}'
)
SELECT 
    months.month,
    IFNULL(SUM(a.occurence_count),0) AS message_count
FROM 
    months
LEFT JOIN 
    activity a ON strftime('%Y-%m', months.month) = strftime('%Y-%m', a.day) 
    AND a.event_name = 'message_sent'
GROUP BY 
    months.month
ORDER BY 
    months.month ASC;
  `;

  const data = resultAsList<{ month: string; message_count: number }>(
    db.exec(query)[0]
  ).map(({ month, message_count }) => ({
    label: new Intl.DateTimeFormat(i18next.language, {
      year: "2-digit",
      month: "2-digit",
    }).format(new Date(month)),
    value: message_count,
  }));

  return data;
}
