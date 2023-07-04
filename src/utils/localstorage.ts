"use client";

import { Uint8ArrayToString, stringToUint8Array } from "./convert";

export function storeUint8Array(id: string, value: Uint8Array) {
  localStorage.setItem(id, Uint8ArrayToString(value));
}

export function retrieveUint8Array(id: string) {
  const data = localStorage.getItem(id);
  return data ? stringToUint8Array(data) : null;
}
