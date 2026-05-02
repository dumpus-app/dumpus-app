import { type Database } from "sql.js";
import { type CreateSlice } from ".";
import { type ConfigSlice } from "./config";

type State = {
  db: null | Database;
};

type Actions = {
  setDB: (v: State["db"]) => void;
  getNextID: (v: string | null) => string;
  getTimeRangeDates: ({
    timeRange,
    db,
  }: {
    timeRange: ConfigSlice["timeRange"];
    db: State["db"];
  }) => {
    start: string;
    startLimit: string;
    end: string;
    endLimit: string;
  };
};

export type DatabaseSlice = State & Actions;

// Memoize the MIN(day)/MAX(day) full-table scan per database instance.
// Without this cache, every render of every data hook (and there are ~10 of
// them across the screens) re-runs that scan against the full activity table,
// which can have 100k+ rows. WeakMap means stale entries get GC'd when the
// db reference itself gets replaced (e.g. on package switch).
const extremitiesCache = new WeakMap<
  Database,
  [string | null, string | null]
>();

function readExtremities(db: Database): [string | null, string | null] {
  const cached = extremitiesCache.get(db);
  if (cached) return cached;

  const queryData = db.exec(
    "SELECT MIN(day) AS start, MAX(day) AS end FROM activity",
  );
  const row = queryData?.[0]?.values[0] as
    | [string | null, string | null]
    | undefined;
  const computed: [string | null, string | null] = [
    row?.[0] ?? null,
    row?.[1] ?? null,
  ];
  extremitiesCache.set(db, computed);
  return computed;
}

export const createDatabaseSlice: CreateSlice<DatabaseSlice> = (set, get) => ({
  db: null,
  setDB: (v) => set((state) => ({ database: { ...state.database, db: v } })),
  getNextID: (id) => (id ? `${parseInt(id) + 1}` : "0"),
  getTimeRangeDates: ({ timeRange, db }) => {
    // Original code accepted [string, string] | undefined and fell back to
    // (Discord epoch, now) when missing. Preserve that exact behaviour, just
    // backed by a per-db cache instead of a fresh full-table scan each call.
    const ext = db ? readExtremities(db) : null;
    const rawExtremityDates: [string, string] | undefined =
      ext && ext[0] !== null && ext[1] !== null
        ? [ext[0], ext[1]]
        : undefined;

    const startDateLimit = new Date(rawExtremityDates?.[0] || "2015-05-13"); // Discord creation
    const endDate = rawExtremityDates
      ? new Date(rawExtremityDates[1])
      : new Date();

    const startDate = new Date(endDate);

    switch (timeRange) {
      case "4weeks":
        startDate.setDate(startDate.getDate() - 4 * 7);
        break;
      case "6months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "lifetime":
        startDate.setTime(startDateLimit.getTime());
        break;
    }

    function formatDate(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return {
      start: formatDate(startDate),
      startLimit: formatDate(startDateLimit),
      end: formatDate(endDate),
      endLimit: formatDate(endDate),
    };
  },
});
