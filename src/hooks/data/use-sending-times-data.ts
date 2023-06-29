"use client";

import i18next from "i18next";
import { useDataSources } from "./_shared";

export default function useSendingTimesData() {
  const { sql, start, end } = useDataSources();

  function getChartData() {
    const { data, hasError } = sql<{ hour: number; message_count: number }>`
      SELECT
        a.hour,
        SUM(a.occurence_count) as message_count
      FROM activity a
      WHERE a.event_name = 'message_sent' 
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY hour
      ORDER BY hour ASC;
  `;

    if (hasError) {
      return null;
    }

    for (let i = 0; i < 24; i++) {
      const stat: (typeof data)[0] | undefined = data[i];

      if (!stat || stat?.hour !== i) {
        data.splice(i, 0, { hour: i, message_count: 0 });
      }
    }

    return data.map(({ hour, message_count }) => ({
      label: hour,
      value: message_count,
    }));
  }

  function getAvgMessagesSentPerDay() {
    const { data, hasError } = sql<{
      average_daily_occurences: number;
    }>`
      SELECT
        ROUND(AVG(daily_occurences)) AS average_daily_occurences
      FROM (
        SELECT
            day,
            SUM(occurence_count) AS daily_occurences
        FROM 
            activity
        WHERE event_name = 'message_sent' 
        AND day BETWEEN '${start}' AND '${end}'
        GROUP BY 
            day
      ) AS daily_summary;
    `;

    return hasError ? null : data[0].average_daily_occurences;
  }

  function getAvgOpeningCountPerDay() {
    const { data, hasError } = sql<{ average_daily_occurences: number }>`
      SELECT ROUND(AVG(total_occurence)) as average_daily_occurences
      FROM (
        SELECT day, SUM(occurence_count) as total_occurence 
        FROM activity
        WHERE event_name = 'app_opened'
        GROUP BY day
      ) daily_counts; 
    `;

    return hasError ? null : data[0].average_daily_occurences;
  }

  return {
    chartData: getChartData(),
    statsData: {
      avgMessagesSentPerDay: getAvgMessagesSentPerDay(),
      avgOpeningCountPerDay: getAvgOpeningCountPerDay(),
    },
  };
}
