"use client";

import { useAtom } from "jotai";
import initSqlJs, { type QueryExecResult } from "sql.js";
import { dbAtom } from "~/stores/db";
import LZString from "lz-string";
import pako from "pako";
import { useRef } from "react";
import { configAtom } from "~/stores";
import { defu } from "defu";
import type { PackageData } from "~/types/sql";

const STORAGE_KEY = "db";
export const getStorageKey = (id: string) => `${STORAGE_KEY}:${id}`;

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
    initData,
  }: {
    id: string;
    initData?: {
      initialData: ArrayBuffer;
      packageLink: string;
      UPNKey: string;
      backendURL: string;
    };
  }) {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let data: Uint8Array;
    if (initData) {
      data = pako.inflate(initData.initialData);
      store(id, data);
    } else {
      data = retrieve(id)!;
    }

    const { Database } = await initSqlJs({
      locateFile: (file) => `/sqljs/${file}`,
    });
    const _db = new Database(data);
    if (initData) {
      const issueDate = resultAsList<{ issue_date: string }>(
        _db.exec("SELECT MIN(day) AS issue_date FROM activity")[0]
      )[0].issue_date;
      const packageData = resultAsList<PackageData>(
        _db.exec("SELECT * FROM package_data LIMIT 1;")[0]
      )[0];
      setConfig(
        defu(
          {
            db: {
              packages: [
                {
                  id,
                  packageLink: initData.packageLink,
                  UPNKey: initData.UPNKey,
                  issueDate,
                  backendURL: initData.backendURL,
                  ...packageData,
                },
              ],
              selectedId: id,
            },
          } satisfies typeof config,
          config
        )
      );
    }
    setDb(_db);
  }

  type DefaultT = Record<string, any>;
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

  return { init, db, resultAsList };
}
