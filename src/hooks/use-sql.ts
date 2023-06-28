"use client";

import { resultAsList } from "~/utils/sql";
import useSafeDB from "./use-safe-db";
import { createLogger } from "~/utils/logger";
import { concatTemplateStringArgs } from "~/utils";

const logger = createLogger({ tag: "SQL" });

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
      const data = resultAsList<TRes>(db.exec(query)[0]);
      logger.log(`Query\n${query}\ntook ${+new Date() - +startDate}ms`);

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
