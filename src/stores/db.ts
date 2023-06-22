import { atom } from "jotai";
import { type Database } from "sql.js";
import { configAtom } from ".";
import { atomWithLocalStorage } from "~/utils/jotai";

export const dbIdAtom = atom((get) => {
  const config = get(configAtom);
  return config.db.selectedId;
});

export const nextDbIdAtom = atom((get) => {
  const id = get(dbIdAtom);

  return id ? `${parseInt(id) + 1}` : "0";
});

export const dbAtom = atom<null | Database>(null);

export const dbExtremityDatesAtom = atom((get) => {
  const db = get(dbAtom);

  const results = db?.exec(
    "SELECT MIN(day) AS start, MAX(day) AS end FROM activity"
  );

  return results?.[0].values[0] as unknown as [string, string] | undefined;
});

export const timeRanges = ["4 weeks", "6 months", "Year", "Lifetime"] as const;

export const timeRangeAtom = atomWithLocalStorage<(typeof timeRanges)[number]>(
  "time-range",
  "6 months"
);

export const timeRangeDates = atom((get) => {
  const timeRange = get(timeRangeAtom);
  const extremityDates = get(dbExtremityDatesAtom);

  console.log(extremityDates);

  const firstDateLimit = new Date(extremityDates?.[0] || "2015-05-13");
  const endDate = extremityDates ? new Date(extremityDates[1]) : new Date();

  const firstDate = new Date();

  switch (timeRange) {
    case "4 weeks":
      firstDate.setDate(firstDate.getDate() - 4 * 7);
      break;
    case "6 months":
      firstDate.setMonth(firstDate.getMonth() - 6);
      break;
    case "Year":
      firstDate.setFullYear(firstDate.getFullYear() - 1);
      break;
    case "Lifetime":
      firstDate.setFullYear(firstDate.getFullYear() - 10);
      if (firstDate < firstDateLimit) {
        firstDate.setDate(firstDateLimit.getDate());
      }
      break;
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return [formatDate(firstDate), formatDate(endDate)];
});
