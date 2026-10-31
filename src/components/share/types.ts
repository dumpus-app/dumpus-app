import type { TimeRange } from "~/stores/config";

/** The small counts of the habits card, in the order the card prefers them. */
export const HABITS = [
  "reactions",
  "edits",
  "notifications",
  "slashCommands",
  "voiceMessages",
  "captchas",
  "logins",
  "appsAuthorized",
] as const;

export type Habit = (typeof HABITS)[number];

export type SharePerson = {
  id: string;
  name: string;
  count: number;
  avatar: string;
};

export type ShareServer = {
  id: string;
  name: string;
  count: number;
  /** `null` when the widget API doesn't know the server: initials instead. */
  icon: string | null;
};

/**
 * What the share cards show for the selected time range. A stat is `null`
 * when the package can't know it, which a card must never show as 0.
 */
export type ShareData = {
  /** From the package id, so a user's cards keep the same texture. */
  seed: number;
  user: { displayName: string; handle: string; avatar: string };
  range: {
    id: TimeRange;
    /** First and last day of the range, `YYYY-MM-DD`. */
    start: string;
    end: string;
  };
  messages: {
    total: number | null;
    perDay: number | null;
    /** Messages sent per day, week or month of the range, oldest first. */
    series: { start: string; count: number }[];
    bucket: "day" | "week" | "month";
  };
  topDMs: SharePerson[];
  topServers: ShareServer[];
  /** Messages sent per hour of the day, 0 to 23. */
  byHour: number[];
  /** `null` when the package is partial, where the app hides these. */
  time: {
    minutes: number | null;
    appOpens: number | null;
    voiceMinutes: number | null;
    avgSessionMinutes: number | null;
  } | null;
  /** `null` for an event type the export doesn't carry, never 0. */
  habits: Record<Habit, number | null>;
  /** People the user sent a DM to in the range. */
  dmCount: number | null;
  serverCount: number | null;
};
