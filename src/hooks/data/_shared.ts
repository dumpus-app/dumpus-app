"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import useSQL from "../use-sql";
import { useAppStore } from "~/stores";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const sql = useSQL();
  const [timeRange, db, getExtremityDates, getTimeRangeDates] = useAppStore(
    ({ config, database }) => [
      config.timeRange,
      database.db,
      database.getExtremityDates,
      config.getTimeRangeDates,
    ]
  );
  const [start, end, startLimit, endLimit] = getTimeRangeDates(
    timeRange,
    getExtremityDates(db)
  );

  return { sql, start, end, startLimit, endLimit };
}
