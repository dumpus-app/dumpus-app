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

type Result<TRes> =
  | {
      data: TRes[];
      hasError: false;
      error: null;
    }
  | {
      data: null;
      hasError: true;
      error: Error;
    };

export default function useSQL() {
  const db = useSafeDB();

  function read<TRes extends Record<string, any>>(query: string) {
    const cache = cacheOf(db);
    let data = cache.get(query) as TRes[] | undefined;
    if (!data) {
      // sql.js gives no result at all for a query without rows.
      const result = db.exec(query)[0];
      data = result ? resultAsList<TRes>(result) : [];
      cache.set(query, data);
    }
    return data;
  }

  function run<TRes extends Record<string, any>>(
    query: string,
    emptyIsError: boolean,
  ): Result<TRes> {
    try {
      const data = read<TRes>(query);
      if (emptyIsError && data.length === 0) {
        return { data: null, hasError: true, error: new Error("no rows") };
      }
      return { data, hasError: false, error: null };
    } catch (err) {
      logger.error(err);
      return { data: null, hasError: true, error: err as Error };
    }
  }

  /** Runs a query. No rows reads as an error, which hooks return as null. */
  function sql<T extends Record<string, any> = never, TRes extends T = T>(
    strings: TemplateStringsArray,
    ...expr: (string | number)[]
  ) {
    return run<TRes>(concatTemplateStringArgs(strings, expr), true);
  }

  /** Same as `sql`, except that no rows is an empty list. */
  function rows<T extends Record<string, any> = never, TRes extends T = T>(
    strings: TemplateStringsArray,
    ...expr: (string | number)[]
  ) {
    return run<TRes>(concatTemplateStringArgs(strings, expr), false);
  }

  return Object.assign(sql, { rows });
}
