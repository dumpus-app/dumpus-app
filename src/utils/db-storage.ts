"use client";

import { createLogger } from "./logger";

// Each package's SQLite database, kept between sessions as raw bytes in
// IndexedDB, one record per package id. Before, the app kept it in
// `localStorage` as LZString text of the JSON of the bytes (see
// `./localstorage.ts`), which froze the import for seconds and didn't fit
// larger packages in WebKit; `migrateLegacyPackage` moves those over.

const logger = createLogger({ tag: "package storage" });

const DB_NAME = "dumpus";
const DB_VERSION = 1;
const STORE = "packages";
// Some WebKit versions left `indexedDB.open()` pending forever on a launch;
// past this, the open fails and the app can say so instead of spinning.
const OPEN_TIMEOUT_MS = 10_000;

let connection: Promise<IDBDatabase> | null = null;

function connect() {
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("IndexedDB didn't open in time")),
      OPEN_TIMEOUT_MS,
    );
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      // A newer version of the app in another tab wants to upgrade: let it,
      // and open again on the next call, as after the browser closed it.
      db.onversionchange = () => {
        db.close();
        connection = null;
      };
      db.onclose = () => {
        connection = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      clearTimeout(timer);
      reject(request.error);
    };
  }).catch((err) => {
    connection = null;
    throw err;
  });
  return connection;
}

function run<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return connect().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = operation(transaction.objectStore(STORE));
        const fail = () =>
          reject(
            transaction.error ??
              request.error ??
              new Error("IndexedDB transaction aborted"),
          );
        // Resolved once committed. A full disk aborts the transaction with a
        // `QuotaExceededError`.
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = fail;
        transaction.onerror = fail;
      }),
  );
}

/** The bytes of package `id`'s database, or null when none is stored. */
export async function getPackageBytes(id: string) {
  const value = await run<unknown>("readonly", (store) => store.get(id));
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return null;
}

export async function putPackageBytes(id: string, bytes: Uint8Array) {
  // A structured clone copies the whole buffer under a view, so the record
  // gets a view of exactly the database.
  const exact =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes
      : bytes.slice();
  await run("readwrite", (store) => store.put(exact, id));
}

export async function deletePackageBytes(id: string) {
  await run("readwrite", (store) => store.delete(id));
}

/** Removes every package's database, for a reset of the app. */
export async function clearPackageBytes() {
  await run("readwrite", (store) => store.clear());
}

export function isQuotaError(err: unknown) {
  return (err as { name?: unknown } | null)?.name === "QuotaExceededError";
}

const LEGACY_PREFIX = "db:";

/** The `localStorage` key of package `id`'s database, before IndexedDB. */
export const legacyKey = (id: string) => `${LEGACY_PREFIX}${id}`;

/** Ids of the packages still kept in `localStorage`. */
export function legacyPackageIDs() {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_PREFIX)) {
        ids.push(key.slice(LEGACY_PREFIX.length));
      }
    }
  } catch (err) {
    logger.error(err);
  }
  return ids;
}

function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Moves package `id`'s database from `localStorage` to IndexedDB. Returns its
 * bytes and whether it moved, or null when `localStorage` doesn't have it. The
 * old entry is removed only once IndexedDB gave the same bytes back; if
 * anything fails, the entry stays for the next start, and the bytes read from
 * it still open the package. Throws only when the old entry can't be read.
 */
export async function migrateLegacyPackage(id: string) {
  if (!legacyPackageIDs().includes(id)) return null;

  // LZString is only needed here, so it stays out of the app's first load.
  const { retrieveUint8Array } = await import("./localstorage");
  const bytes = retrieveUint8Array(legacyKey(id));
  if (!bytes) return null;

  let moved = false;
  try {
    await putPackageBytes(id, bytes);
    const copy = await getPackageBytes(id);
    if (copy && sameBytes(copy, bytes)) {
      localStorage.removeItem(legacyKey(id));
      moved = true;
      logger.info(`package ${id} moved to IndexedDB`);
    } else {
      logger.error(`package ${id}: IndexedDB gave other bytes back, kept`);
    }
  } catch (err) {
    logger.error(`package ${id}: kept in localStorage`, err);
  }
  return { bytes, moved };
}
