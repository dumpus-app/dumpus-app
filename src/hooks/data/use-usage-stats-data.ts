"use client";

import i18next from "i18next";
import { useDataSources } from "./_shared";

export default function useUsageStatsData() {
  const { sql, start, end } = useDataSources();

  function getNetworkSize() {
    const { data, hasError } = sql<{ network_size: number }>`
      SELECT
        COUNT(DISTINCT dm_user_id) as network_size
      FROM dm_channels_data;
    `;

    return hasError ? null : data[0].network_size;
  }

  function getJoinedGuilds() {
    const { data, hasError } = sql<{ join_count: number }>`
      SELECT
        SUM(a.occurence_count) as join_count
      FROM activity a
      WHERE a.event_name = 'guild_joined'
      AND a.day BETWEEN '${start}' AND '${end}';
    `;

    return hasError ? null : data[0].join_count;
  }

  function getTopHour() {
    const { data, hasError } = sql<{
      hour: number;
      message_count: number;
    }>`
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

    return hasError ? null : data[0].hour;
  }

  function getSpentMoney() {
    const { data, hasError } = sql<{ total_spent: number }>`
      SELECT
        SUM(payment_amount) / 100 as total_spent
      FROM payments
    `;

    return hasError ? null : data[0].total_spent;
  }

  return {
    networkSize: getNetworkSize(),
    joinedGuilds: getJoinedGuilds(),
    topHour: getTopHour(),
    spentMoney: getSpentMoney(),
  };
}
