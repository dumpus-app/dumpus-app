"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import { useAtomValue } from "jotai";
import { timeRangeDates } from "~/stores/db";
import useSQL from "../use-sql";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const sql = useSQL();
  const [start, end] = useAtomValue(timeRangeDates);

  return { sql, start, end };
}
