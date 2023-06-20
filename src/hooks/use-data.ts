"use client";

import { useAtomValue } from "jotai";
import useSafeDB from "./use-safe-db";
import useSQL from "./use-sql";
import { timeRangeDates } from "~/stores/db";
import type { DmChannelsData, Guild, GuildChannelsData } from "~/types/sql";

export function useDataSources() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  return { db, resultAsList, start, end };
}

export function useTopDMsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
  SELECT d.dm_user_id,
    d.user_name,
    d.user_avatar_url,
    SUM(a.occurence_count) AS message_count,
    d.channel_id
  FROM activity a
  JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
  WHERE a.event_name = 'message_sent'
  AND a.day BETWEEN '${start}' AND '${end}'
  GROUP BY d.dm_user_id
  ORDER BY message_count DESC;
  `;

  const data = resultAsList<
    Pick<
      DmChannelsData,
      "dm_user_id" | "user_name" | "user_avatar_url" | "channel_id"
    > & { message_count: number }
  >(db.exec(query)[0]);

  return data.map((dm, i) => ({
    ...dm,
    rank: i + 1,
  }));
}

export function useTopChannelsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
  SELECT channel_name, channel_id, c.guild_id, g.guild_name,
    SUM(a.occurence_count) AS message_count    
FROM guild_channels_data c
JOIN activity a ON a.associated_channel_id = c.channel_id
JOIN guilds g ON g.guild_id = c.guild_id
WHERE a.event_name = 'message_sent'
AND a.day BETWEEN '${start}' AND '${end}'
GROUP BY channel_name
ORDER BY message_count DESC;
  `;

  const data = resultAsList<
    Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
      Pick<Guild, "guild_name"> & {
        message_count: number;
      }
  >(db.exec(query)[0]);

  return data.map((channel, i) => ({
    ...channel,
    rank: i + 1,
  }));
}

export function useTopGuildsData() {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
SELECT guild_name,
    guild_id,
    SUM(a.occurence_count) AS message_count
FROM guilds
JOIN activity a ON a.associated_guild_id = guilds.guild_id
WHERE a.event_name = 'message_sent'
AND a.day BETWEEN '${start}' AND '${end}'
GROUP BY guild_name
ORDER BY message_count DESC;
  `;
  const data = resultAsList<
    Pick<Guild, "guild_name" | "guild_id"> & { message_count: number }
  >(db.exec(query)[0]);

  return data.map((guild, i) => ({
    ...guild,
    rank: i + 1,
  }));
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
