"use client";

import type { Database } from "sql.js";
import { resultAsList } from "~/utils/sql";
import useSafeDB from "./use-safe-db";
import { createLogger } from "~/utils/logger";
import { concatTemplateStringArgs } from "~/utils";

const logger = createLogger({ tag: "SQL" });

// Rows already read, one map per open database, keyed by the query text. A
// package switch opens a new `Database`, so it starts with an empty map and
// never gets the rows of the package before it; the old map goes with the old
// database. A database never changes once opened, so nothing else expires.
const queriesCaches = new WeakMap<Database, Map<string, unknown[]>>();

function cacheOf(db: Database) {
  let cache = queriesCaches.get(db);
  if (!cache) {
    cache = new Map();
    queriesCaches.set(db, cache);
  }
  return cache;
}

export default function useSQL() {
  const db = useSafeDB();

  function sql<T extends Record<string, any> = never, TRes extends T = T>(
    strings: TemplateStringsArray,
    ...expr: (string | number)[]
  ):
    | {
        data: TRes[];
        hasError: false;
        error: null;
      }
    | {
        data: null;
        hasError: true;
        error: Error;
      } {
    const query = concatTemplateStringArgs(strings, expr);

    try {
      const cache = cacheOf(db);
      let data = cache.get(query) as TRes[] | undefined;

      if (!data) {
        data = resultAsList<TRes>(db.exec(query)[0]);
        cache.set(query, data);
      }

      return {
        data,
        hasError: false,
        error: null,
      };
    } catch (err) {
      logger.error(err);
      return {
        data: null,
        hasError: true,
        error: err as Error,
      };
    }
  }

  return sql;
}
