"use client";

import { stringToUint8Array } from "./convert";

/**
 * Reads a package's database the way the app stored it in `localStorage`
 * before IndexedDB, for the move in `./db-storage.ts`.
 */
export function retrieveUint8Array(id: string) {
  const data = localStorage.getItem(id);
  return data ? stringToUint8Array(data) : null;
}
