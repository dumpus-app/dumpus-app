"use client";

import i18next from "i18next";
import { useDataSources } from "./_shared";

export default function useUsageStatsData() {
  const { db, resultAsList, start, end } = useDataSources();

  function getNetworkSize() {
    const query = `
      SELECT
        COUNT(DISTINCT dm_user_id) as network_size
      FROM dm_channels_data;
    `;

    const data = resultAsList<{ network_size: number }>(db.exec(query)[0])[0];

    return data.network_size;
  }

  function getJoinedGuilds() {
    const query = `
      SELECT
        SUM(a.occurence_count) as join_count
      FROM activity a
      WHERE a.event_name = 'guild_joined'
      AND a.day BETWEEN '${start}' AND '${end}';
    `;

    const data = resultAsList<{ join_count: number }>(db.exec(query)[0])[0];

    return data.join_count;
  }

  function getTopHour() {
    const query = `
    SELECT hour,
      SUM(occurence_count) AS message_count
    FROM 
        activity
    WHERE event_name = 'message_sent' 
        AND day BETWEEN '${start}' AND '${end}'
    GROUP BY hour
    ORDER BY message_count DESC
    LIMIT 1
    `;

    const { hour, message_count } = resultAsList<{
      hour: number;
      message_count: number;
    }>(db.exec(query)[0])[0];

    return new Intl.DateTimeFormat(i18next.language, {
      hour: "numeric",
    }).format(
      (() => {
        const date = new Date();
        date.setHours(hour);
        return date;
      })()
    );
  }

  return {
    networkSize: getNetworkSize(),
    joinedGuilds: getJoinedGuilds(),
    topHour: getTopHour(),
  };
}
