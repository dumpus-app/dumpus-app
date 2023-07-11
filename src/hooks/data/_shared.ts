"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import useSQL from "../use-sql";
import { useConfigStore } from "~/stores/config";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const sql = useSQL();
  const [start, end] = useConfigStore((state) => state.computed.timeRangeDates);

  return { sql, start, end };
}
