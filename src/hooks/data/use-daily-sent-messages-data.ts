"use client";

import i18next from "i18next";
import { useDataSources } from "./_shared";

export default function useDailySentMessagesData() {
  const { db, resultAsList, start, end } = useDataSources();

  const totalDays = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.floor(totalDays / (1000 * 60 * 60 * 24));

  const periodLength = days > 360 ? 30 : days > 90 ? 7 : 1;

  const query = `
    WITH RECURSIVE dates(day, day_group) AS (
      VALUES('${start}', 1)
      UNION ALL
      SELECT date(day, '+1 day'), 
      CASE WHEN (julianday(date(day, '+1 day')) - julianday('${start}')) % ${periodLength} = 0 THEN day_group + 1 ELSE day_group END
      FROM dates
      WHERE day < date('${start}', '+${days} days')
    )
    SELECT 
      MIN(dates.day) as period_start,
      MAX(dates.day) as period_end,
      IFNULL(SUM(a.occurence_count),0) AS message_count
    FROM 
      dates
    LEFT JOIN 
      activity a ON dates.day = a.day 
      AND a.event_name = 'message_sent'
    GROUP BY 
      day_group
    ORDER BY 
      period_start ASC;
  `;

  const data = resultAsList<{ period_start: string; message_count: number }>(
    db.exec(query)[0]
  ).map(({ period_start, message_count }) => ({
    label: new Intl.DateTimeFormat(i18next.language, {
      year: "2-digit",
      month: "2-digit",
    }).format(new Date(period_start)),
    value: message_count,
  }));

  return data;
}
