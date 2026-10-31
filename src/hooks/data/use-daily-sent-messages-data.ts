"use client";

import { groupDays } from "./_chart";
import { useDataSources } from "./_shared";

export default function useDailySentMessagesData() {
  const { sql, start, end } = useDataSources();

  // Every event type, not only messages, as this chart always counted.
  const { data, hasError } = sql.rows<{ day: string; count: number }>`
    SELECT day, SUM(occurence_count) AS count
    FROM activity
    WHERE day BETWEEN '${start}' AND '${end}'
    GROUP BY day;
  `;

  if (hasError) {
    return null;
  }

  return groupDays(start, end, data);
}
