"use client";

import { useAtom } from "jotai";
import initSqlJs, { type QueryExecResult } from "sql.js";
import { dbAtom } from "~/stores/db";
import usePackageAPI from "./use-package-api";
import LZString from "lz-string";
import pako from "pako";
import { useRef } from "react";

const STORAGE_KEY = "db";
const getStorageKey = (id: string) => `${STORAGE_KEY}:${id}`;

function store(id: string, value: Uint8Array) {
  localStorage.setItem(
    getStorageKey(id),
    LZString.compressToUTF16(JSON.stringify(Array.from(value)))
  );
}
function retrieve(id: string) {
  let data = localStorage.getItem(getStorageKey(id));
  if (data) {
    return new Uint8Array(JSON.parse(LZString.decompressFromUTF16(data)));
  }
  return null;
}

// TODO: make dynamic
const TEMP_ID = "0";

export default function useSQL() {
  const [db, setDb] = useAtom(dbAtom);
  const api = usePackageAPI({});
  const isInitializedRef = useRef(false);

  function init() {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    let data = retrieve(TEMP_ID);
    initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    }).then(async (SQL) => {
      if (!data) {
        console.log("retrieve");
        const res = await api.data({
          packageID: "",
          UPNKey: "",
        });
        // TODO: handleError
        const decompressed = pako.inflate(res.data!);
        store(TEMP_ID, decompressed);
        data = decompressed;
      }
      const _db = new SQL.Database(data);
      setDb(_db);
    });
  }

  type DefaultT = Record<string, any>;
  function resultAsList<T extends DefaultT>(data?: QueryExecResult) {
    if (!data) return null;
    const { columns, values } = data;
    return values.map((value) => {
      const obj: DefaultT = {};
      columns.forEach((column, i) => {
        obj[column] = value[i];
      });
      return obj as T;
    });
  }

  return { init, db, resultAsList };
}
