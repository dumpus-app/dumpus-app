"use client";

import { useDatabaseStore } from "~/stores/db";

export default function useSafeDB() {
  const db = useDatabaseStore((state) => state.db);

  if (!db) {
    throw new Error("db hasn't been set yet.");
  }

  return db;
}
