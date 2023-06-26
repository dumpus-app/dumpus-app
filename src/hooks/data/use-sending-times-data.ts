"use client";

import i18next from "i18next";
import { useDataSources } from "./_shared";

export default function useSendingTimesData() {
  const { db, resultAsList, start, end } = useDataSources();

  const chartQuery = `
  SELECT
    a.hour,
    SUM(a.occurence_count) as message_count
  FROM activity a
  WHERE a.event_name = 'message_sent' 
  AND a.day BETWEEN '${start}' AND '${end}'
  GROUP BY hour
  ORDER BY hour ASC;
  `;

  const rawChartData = resultAsList<{ hour: number; message_count: number }>(
    db.exec(chartQuery)[0]
  );

  for (let i = 0; i < 24; i++) {
    const stat: (typeof rawChartData)[0] | undefined = rawChartData[i];

    if (!stat || stat?.hour !== i) {
      rawChartData.splice(i, 0, { hour: i, message_count: 0 });
    }
  }

  const chartData = rawChartData.map(({ hour, message_count }) => ({
    label: new Intl.DateTimeFormat(i18next.language, {
      hour: "numeric",
    }).format(
      (() => {
        const date = new Date();
        date.setHours(hour);
        return date;
      })()
    ),
    value: message_count,
  }));

  return {
    chartData,
    statsData: {
      avgMessagesSentPerDay: chartData.reduce(
        (avg, { value }, _, { length }) => {
          return avg + value / length;
        },
        0
      ),
    },
  };
}
