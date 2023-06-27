import { QueryExecResult } from "sql.js";

type DefaultT = Record<string, any>;
export function resultAsList<T extends DefaultT>(data: QueryExecResult) {
  const { columns, values } = data;
  return values.map((value) => {
    const obj: DefaultT = {};
    columns.forEach((column, i) => {
      obj[column] = value[i];
    });
    return obj as T;
  });
}
