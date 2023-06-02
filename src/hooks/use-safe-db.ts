"use client";

import { useAtomValue } from "jotai";
import { dbAtom } from "~/stores/db";

export default function useSafeDB() {
  const db = useAtomValue(dbAtom);

  if (!db) {
    throw new Error("db hasn't been set yet.");
  }

  return db;
}
