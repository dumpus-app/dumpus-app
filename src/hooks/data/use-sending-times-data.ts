"use client";

import { localHours, messagesPerDayHour } from "./_hours";
import { useDataSources } from "./_shared";

export default function useSendingTimesData() {
  const { sql, start, end } = useDataSources();

  /** Messages per hour of the day, on the device's clock. */
  function getChartData() {
    const rows = messagesPerDayHour(sql, start, end);

    if (!rows) {
      return null;
    }

    return localHours(rows).map((value, hour) => ({
      label: hour,
      value,
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
