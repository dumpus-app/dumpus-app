"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import useSQL from "../use-sql";
import { useAppStore } from "~/stores";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const sql = useSQL();
  const [timeRange, db, getTimeRangeDates] = useAppStore(
    ({ config, database }) => [
      config.timeRange,
      database.db,
      database.getTimeRangeDates,
    ]
  );

  const dates = getTimeRangeDates({ timeRange, db });
  console.log(dates);

  return { sql, ...dates };
}
