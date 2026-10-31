const DAY_MS = 24 * 60 * 60 * 1000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * The bars of a chart over the days from `start` to `end`, both included: one
 * per day up to 90 days, one per 7 days up to 360, one per 30 days beyond, the
 * first starting on `start`. Each bar is labelled with its first day and
 * counts the `count`s of its days in `perDay`, 0 where a day has no row.
 *
 * These are the groups the charts' recursive list of dates gave in SQLite,
 * which joined every day of the range with every row of the activity.
 */
export function groupDays(
  start: string,
  end: string,
  perDay: { day: string; count: number }[],
) {
  const days = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / DAY_MS,
  );
  const periodLength = days > 360 ? 30 : days > 90 ? 7 : 1;

  const counts = new Map(perDay.map(({ day, count }) => [day, count]));
  const first = Date.parse(`${start}T00:00:00Z`);
  const bars: { label: string; value: number }[] = [];
  for (let offset = 0; offset <= days; offset += periodLength) {
    let value = 0;
    for (let k = offset; k < Math.min(offset + periodLength, days + 1); k++) {
      value += counts.get(isoDay(first + k * DAY_MS)) ?? 0;
    }
    bars.push({ label: isoDay(first + offset * DAY_MS), value });
  }
  return bars;
}
