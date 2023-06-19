"use client";

import { useAtom } from "jotai";
import initSqlJs, { type QueryExecResult } from "sql.js";
import { dbAtom } from "~/stores/db";
import LZString from "lz-string";
import pako from "pako";
import { useRef } from "react";
import { configAtom } from "~/stores";

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

export default function useSQL() {
  const [db, setDb] = useAtom(dbAtom);
  const [config, setConfig] = useAtom(configAtom);

  const isInitializedRef = useRef(false);

  async function init({
    id,
    initialData,
  }: {
    id: string;
    initialData?: ArrayBuffer;
  }) {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let data: Uint8Array;
    if (initialData) {
      data = pako.inflate(initialData);
      store(id, data);
      // TODO: use defu
      setConfig({
        ...config,
        db: {
          ...config.db,
          selectedId: id,
        },
      });
    } else {
      data = retrieve(id)!;
    }

    const { Database } = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });
    setDb(new Database(data));
  }

  type DefaultT = Record<string, any>;
  function resultAsList<T extends DefaultT>(data: QueryExecResult) {
    // if (!data) return null;
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
