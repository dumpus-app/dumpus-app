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

export const createDatabaseSlice: CreateSlice<DatabaseSlice> = (set, get) => ({
  db: null,
  setDB: (v) => set((state) => ({ database: { ...state.database, db: v } })),
  getNextID: (id) => (id ? `${parseInt(id) + 1}` : "0"),
  getTimeRangeDates: ({ timeRange, db }) => {
    const queryData = db?.exec(
      "SELECT MIN(day) AS start, MAX(day) AS end FROM activity",
    );
    const rawExtremityDates = queryData?.[0].values[0] as
      | [string, string]
      | undefined;

    const startDateLimit = new Date(rawExtremityDates?.[0] || "2015-05-13"); // Discord creation
    const endDate = rawExtremityDates
      ? new Date(rawExtremityDates[1])
      : new Date();

    const startDate = new Date(endDate);

    switch (timeRange) {
      case "4 weeks":
        startDate.setDate(startDate.getDate() - 4 * 7);
        break;
      case "6 months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "Year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "Lifetime":
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
