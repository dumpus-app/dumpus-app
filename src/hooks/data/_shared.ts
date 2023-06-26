"use client";

import { SQL_DEFAULT_LIMIT } from "~/constants";
import useSafeDB from "../use-safe-db";
import useSQL from "../use-sql";
import { useAtomValue } from "jotai";
import { timeRangeDates } from "~/stores/db";

export function sqlOffset(offset: number) {
  return offset * SQL_DEFAULT_LIMIT;
}

export function useDataSources() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  return { db, resultAsList, start, end };
}
