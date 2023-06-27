"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import useSafeDB from "../use-safe-db";
import useSQL from "../use-sql";
import { useAtomValue } from "jotai";
import { timeRangeDates } from "~/stores/db";
import useTempSQL from "../use-temp-sql";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  // TODO: remove {db} export
  const db = useSafeDB();
  // TODO: remove {resultAsList} export
  const { resultAsList } = useSQL();
  const sql = useTempSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  return { db, resultAsList, sql, start, end };
}
