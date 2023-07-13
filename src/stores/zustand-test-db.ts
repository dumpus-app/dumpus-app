import { type Database } from "sql.js";
import { type CreateSlice } from "./zustand-test";

type State = {
  db: null | Database;
};

type Actions = {
  setDB: (v: State["db"]) => void;
  getNextID: (v: string | null) => string;
  getExtremityDates: (v: State["db"]) => [string, string] | undefined;
};

export type DatabaseSlice = State & Actions;

export const createDatabaseSlice: CreateSlice<DatabaseSlice> = (set, get) => ({
  db: null,
  setDB: (v) => set((state) => ({ database: { ...state.database, db: v } })),
  getNextID: (id) => (id ? `${parseInt(id) + 1}` : "0"),
  getExtremityDates: (db) => {
    const results = db?.exec(
      "SELECT MIN(day) AS start, MAX(day) AS end FROM activity"
    );

    return results?.[0].values[0] as unknown as any;
  },
});
