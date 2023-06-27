"use client";

import { resultAsList } from "~/utils/sql";
import useSafeDB from "./use-safe-db";
import { createLogger } from "~/utils/logger";
import { concatTemplateStringArgs } from "~/utils";

const logger = createLogger({ tag: "Temp SQL" });

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
      const data = resultAsList<TRes>(db.exec(query)[0]);

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
