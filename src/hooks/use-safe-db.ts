"use client";

import { useAppStore } from "~/stores";

export default function useSafeDB() {
  const db = useAppStore(({ database }) => database.db);

  if (!db) {
    throw new Error("db hasn't been set yet.");
  }

  return db;
}
