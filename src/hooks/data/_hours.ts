import type useSQL from "../use-sql";

const HOUR_MS = 60 * 60 * 1000;

export type DayHourCount = { day: string; hour: number | null; count: number };

/**
 * The messages sent from `start` to `end`, summed per UTC day and hour, for
 * `localHours`. Null without any.
 */
export function messagesPerDayHour(
  sql: ReturnType<typeof useSQL>,
  start: string,
  end: string,
) {
  const { data } = sql<DayHourCount>`
    SELECT day, hour, SUM(occurence_count) AS count
    FROM activity
    WHERE event_name = 'message_sent'
    AND day BETWEEN '${start}' AND '${end}'
    GROUP BY day, hour;
  `;
  return data;
}

/**
 * Message counts per hour of the day on this device's clock. The database
 * keeps them per UTC day and hour, so each is moved to the local hour of that
 * moment, which also puts summer and winter time right.
 */
export function localHours(rows: DayHourCount[]) {
  const hours = new Array<number>(24).fill(0);
  for (const { day, hour, count } of rows) {
    if (hour === null) continue;
    const at = Date.parse(`${day}T00:00:00Z`) + hour * HOUR_MS;
    hours[new Date(at).getHours()] += count;
  }
  return hours;
}

/** The local hour with the most messages, the earliest of a tie, or null. */
export function topLocalHour(rows: DayHourCount[] | null) {
  if (!rows) return null;
  const hours = localHours(rows);
  let top: number | null = null;
  hours.forEach((count, hour) => {
    if (count > 0 && (top === null || count > hours[top])) top = hour;
  });
  return top;
}
