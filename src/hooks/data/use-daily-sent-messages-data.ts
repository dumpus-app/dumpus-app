"use client";

import { useDataSources } from "./_shared";

export default function useDailySentMessagesData() {
  const { sql, start, end } = useDataSources();

  const totalDays = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.floor(totalDays / (1000 * 60 * 60 * 24));

  const periodLength = days > 360 ? 30 : days > 90 ? 7 : 1;

  const { data, hasError } = sql<{
    period_start: string;
    message_count: number;
  }>`
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
      IFNULL(SUM(joined_data.occurence_count),0) AS message_count
    FROM 
      dates
    LEFT JOIN 
      (SELECT a.day, a.occurence_count
      FROM activity a
      ) AS joined_data
      ON dates.day = joined_data.day 
    GROUP BY 
      day_group
    ORDER BY 
      period_start ASC;
  `;

  if (hasError) {
    return null;
  }

  return data.map(({ period_start, message_count }) => ({
    label: period_start,
    value: message_count,
  }));
}
