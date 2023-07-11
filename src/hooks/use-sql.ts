"use client";

import { resultAsList } from "~/utils/sql";
import useSafeDB from "./use-safe-db";
import { createLogger } from "~/utils/logger";
import { concatTemplateStringArgs } from "~/utils";
import CRC32 from "crc-32";

const logger = createLogger({ tag: "SQL" });

const queriesCache = new Map<number, any[]>();

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
      const startDate = new Date();

      const cacheKey = CRC32.str(query);
      let data: TRes[];
      const cachedData = queriesCache.get(cacheKey);

      if (cachedData) {
        data = cachedData;
      } else {
        data = resultAsList<TRes>(db.exec(query)[0]);
        queriesCache.set(cacheKey, data);
      }

      // logger.log(
      //   `Query\n${query}\ntook ${+new Date() - +startDate}ms${
      //     cachedData ? " (from cache)" : ""
      //   }`
      // );

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
