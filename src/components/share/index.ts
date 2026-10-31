import Cover from "./Cover";
import Habits, { habits } from "./Habits";
import Messages, { hasMessages } from "./Messages";
import PeakHour, { peakHour } from "./PeakHour";
import { Summary, SummarySquare } from "./Summary";
import TimeSpent, { hasTime } from "./TimeSpent";
import TopDMs from "./TopDMs";
import TopServers from "./TopServers";
import type { ShareData } from "./types";

/**
 * Every share card in the order the share sheet shows them, with the rule
 * that leaves one out when the package or the range has too little for it.
 * `file` names the downloaded image.
 */
export const CARDS = [
  { kind: "cover", file: "cover", Card: Cover, shown: () => true },
  { kind: "messages", file: "messages", Card: Messages, shown: hasMessages },
  {
    kind: "topDMs",
    file: "top-dms",
    Card: TopDMs,
    shown: (data: ShareData) => data.topDMs.length >= 3,
  },
  {
    kind: "topServers",
    file: "top-servers",
    Card: TopServers,
    shown: (data: ShareData) => data.topServers.length >= 3,
  },
  {
    kind: "peakHour",
    file: "peak-hour",
    Card: PeakHour,
    shown: (data: ShareData) => peakHour(data) !== null,
  },
  { kind: "time", file: "time", Card: TimeSpent, shown: hasTime },
  {
    kind: "habits",
    file: "habits",
    Card: Habits,
    shown: (data: ShareData) => habits(data).shown.length >= 2,
  },
  { kind: "summary", file: "summary", Card: Summary, shown: () => true },
  {
    kind: "summarySquare",
    file: "summary-square",
    Card: SummarySquare,
    square: true,
    shown: () => true,
  },
] as const;
