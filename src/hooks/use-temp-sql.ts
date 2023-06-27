"use client";

import type { QueryExecResult } from "sql.js";
import useSafeDB from "./use-safe-db";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "Temp SQL" });

export default function useTempSQL() {
  const db = useSafeDB();

  type DefaultT = Record<string, any>;
  // TODO: extract to sql utils
  /**
   * @deprecated use {sql} instead
   */
  function resultAsList<T extends DefaultT>(data: QueryExecResult) {
    const { columns, values } = data;
    return values.map((value) => {
      const obj: DefaultT = {};
      columns.forEach((column, i) => {
        obj[column] = value[i];
      });
      return obj as T;
    });
  }

  // TODO: extract to general utils
  function concatTemplateStringArgs(
    strings: TemplateStringsArray,
    expr: (string | number)[]
  ) {
    let str = "";
    strings.forEach((s, i) => {
      const v = expr[i];
      str +=
        s +
        (v
          ? (() => {
              switch (typeof v) {
                case "number":
                  return v.toString();
                case "string":
                default:
                  return v;
              }
            })()
          : "");
    });
    return str;
  }

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
