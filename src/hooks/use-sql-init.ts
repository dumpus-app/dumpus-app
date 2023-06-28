"use client";

import { defu } from "defu";
import { useAtom, useSetAtom } from "jotai";
import LZString from "lz-string";
import pako from "pako";
import { useRef } from "react";
import initSqlJs from "sql.js";
import { configAtom } from "~/stores";
import { dbAtom } from "~/stores/db";
import type { PackageData } from "~/types/sql";
import { resultAsList } from "~/utils/sql";

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

export default function useSQLInit() {
  const setDb = useSetAtom(dbAtom);
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
      const dateAdded = new Date().toISOString();
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
                  dateAdded,
                  backendURL: initData.backendURL,
                  ...packageData,
                },
              ],
              selectedId: id,
            },
            goToOnboardingAccess: config.goToOnboardingAccess,
          } satisfies typeof config,
          config
        )
      );
    }
    setDb(_db);
  }

  return { init };
}
