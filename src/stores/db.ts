import { atom } from "jotai";
import { type Database } from "sql.js";
import { configAtom } from ".";

export const dbIdAtom = atom((get) => {
  const config = get(configAtom);
  return config.db.selectedId;
});

export const nextDbIdAtom = atom((get) => {
  const id = get(dbIdAtom);

  return id ? `${parseInt(id) + 1}` : "0";
});

export const dbAtom = atom<null | Database>(null);
