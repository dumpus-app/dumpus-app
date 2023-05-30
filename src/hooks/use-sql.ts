"use client";

import { useAtom } from "jotai";
import initSqlJs, { type QueryExecResult } from "sql.js";
import { dbAtom } from "~/stores/db";
import LZString from "lz-string";

function splitQuery(query: string) {
  const parts = query.split("\n");
  return parts;
}

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

  function init() {
    if (db) return;
    const data = retrieve(TEMP_ID);
    initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    }).then((SQL) => {
      const _db = new SQL.Database(data);
      if (!data) {
        // const query = await fetch("/").then(res => res.text())
        const rawQuery = `
        CREATE TABLE activity (event_name TEXT NOT NULL,day TEXT NOT NULL,hour INTEGER,count INTEGER NOT NULL,associated_dm_user_id TEXT,associated_channel_id TEXT,associated_guild_id TEXT,PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id));
        INSERT INTO "activity" VALUES('message_sent','2020-03-30',2,4,NULL,'694126491427930113',NULL);
        INSERT INTO "activity" VALUES('message_sent','2020-01-03',1,2,NULL,'662713138508202018',NULL);
        INSERT INTO "activity" VALUES('message_sent','2022-03-01',1,5,NULL,'947940752720285736',NULL);
        INSERT INTO "activity" VALUES('message_sent','2020-05-18',2,1,NULL,'711789210176061493',NULL);
        INSERT INTO "activity" VALUES('message_sent','2019-04-21',2,16,NULL,'569552594419318794',NULL);
        INSERT INTO "activity" VALUES('message_sent','2019-05-30',2,7,NULL,'569552594419318794',NULL);
                `;
        const queries = splitQuery(rawQuery);
        for (const query of queries) {
          _db.run(query);
        }
        store(TEMP_ID, _db.export());
      }
      setDb(_db);
    });
  }

  function resultAsList(data?: QueryExecResult) {
    if (!data) return null;
    const { columns, values } = data;
    return values.map((value) => {
      const obj: Record<string, any> = {};
      columns.forEach((column, i) => {
        obj[column] = value[i];
      });
      return obj;
    });
  }

  return { init, db, resultAsList };
}
