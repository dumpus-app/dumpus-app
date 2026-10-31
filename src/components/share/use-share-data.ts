"use client";

import { useQueries } from "@tanstack/react-query";
import CRC32 from "crc-32";
import { useShallow } from "zustand/react/shallow";
import { useDataSources } from "~/hooks/data/_shared";
import useSendingTimesData from "~/hooks/data/use-sending-times-data";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import useUserData from "~/hooks/data/use-user-data";
import usePackageAPI from "~/hooks/use-package-api";
import useWidgetAPI from "~/hooks/use-widget-api";
import { useAppStore } from "~/stores";
import { avatarURLFallback } from "~/utils/discord";
import type { ShareData } from "./types";

const TOP = 5;
const DAY_MS = 86_400_000;

/**
 * Discord's CDN serves any avatar or icon as a PNG at a power-of-two size,
 * with `access-control-allow-origin: *`, which drawing the card needs.
 */
function cdnPNG(url: string, size: number) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("discordapp.com")) return url;
    parsed.pathname = parsed.pathname.replace(/\.(webp|gif|jpe?g)$/i, ".png");
    parsed.searchParams.set("size", String(size));
    return parsed.toString();
  } catch {
    return url;
  }
}

function utcDay(day: string) {
  return Date.parse(`${day}T00:00:00Z`);
}

function isoDay(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** One bar per day for 4 weeks, per week up to a year, per month beyond. */
function bucketFor(
  start: string,
  end: string,
): ShareData["messages"]["bucket"] {
  const days = (utcDay(end) - utcDay(start)) / DAY_MS;
  return days <= 62 ? "day" : days <= 370 ? "week" : "month";
}

/** Every bucket of the range, the empty ones at 0. */
function fillSeries(
  rows: { bucket: string | number; count: number }[],
  start: string,
  end: string,
  bucket: ShareData["messages"]["bucket"],
) {
  const counts = new Map(rows.map((row) => [String(row.bucket), row.count]));
  const series: ShareData["messages"]["series"] = [];
  if (bucket === "month") {
    const last = end.slice(0, 7);
    const date = new Date(utcDay(`${start.slice(0, 7)}-01`));
    for (let month = isoDay(+date).slice(0, 7); month <= last;) {
      series.push({ start: `${month}-01`, count: counts.get(month) ?? 0 });
      date.setUTCMonth(date.getUTCMonth() + 1);
      month = isoDay(+date).slice(0, 7);
    }
    return series;
  }
  const step = bucket === "week" ? 7 : 1;
  const total = Math.floor((utcDay(end) - utcDay(start)) / DAY_MS / step);
  for (let i = 0; i <= total; i++) {
    const day = isoDay(utcDay(start) + i * step * DAY_MS);
    series.push({
      start: day,
      count: counts.get(bucket === "week" ? String(i) : day) ?? 0,
    });
  }
  return series;
}

function handleOf(name: string) {
  // New usernames are unique and come with a `#0` tag in old exports.
  const [username, tag] = name.split("#");
  return tag && !/^0+$/.test(tag) ? name : `@${username}`;
}

/**
 * Builds the share cards' data from the app's data hooks for the selected
 * time range, plus the queries only the cards need. Runs only while the share
 * sheet is open.
 */
export default function useShareData() {
  const user = useUserData();
  const timeRange = useAppStore(({ config }) => config.timeRange);
  const usersCache = useAppStore(useShallow(({ usersCache }) => usersCache));
  const { sql, start, end } = useDataSources();
  const usage = useUsageStatsData();
  const topDMsData = useTopDMsData();
  const topGuildsData = useTopGuildsData();
  const { chartData } = useSendingTimesData();
  const packageAPI = usePackageAPI({ baseURL: user.backendURL });
  const { getGuild } = useWidgetAPI({});

  const partial = Boolean(user.package_is_partial);
  // Which activity stream the processor read (#453), absent from databases
  // written before it. The data hooks return `null` for the event types
  // `reporting` never carries; the slash command count below is the cards'
  // own, so it does the same.
  const reducedExport =
    (user as { activity_stream?: string | null }).activity_stream ===
    "reporting";

  const dms = (topDMsData.getData({}) ?? []).slice(0, TOP);
  const guilds = (topGuildsData.getData({}) ?? []).slice(0, TOP);

  // Same keys as `useUserDetails` and the overview's guild cards, so what
  // the overview already fetched comes from the cache.
  const userQueries = useQueries({
    queries: dms.map((dm) => ({
      queryKey: ["user", dm.dm_user_id],
      queryFn: () =>
        packageAPI.user({
          packageID: user.package_id,
          UPNKey: user.UPNKey,
          userID: dm.dm_user_id,
        }),
      staleTime: Infinity,
    })),
  });
  const widgetQueries = useQueries({
    queries: guilds.map((guild) => ({
      queryKey: ["widget", guild.guild_id],
      queryFn: () => getGuild({ id: guild.guild_id }),
      staleTime: Infinity,
    })),
  });

  const bucket = bucketFor(start, end);
  const seriesQuery = sql<{ bucket: string | number; count: number }>`
    SELECT ${
      bucket === "month"
        ? "substr(day, 1, 7)"
        : bucket === "week"
          ? `CAST((julianday(day) - julianday('${start}')) / 7 AS INTEGER)`
          : "day"
    } AS bucket, SUM(occurence_count) AS count
    FROM activity
    WHERE event_name = 'message_sent'
    AND day BETWEEN '${start}' AND '${end}'
    GROUP BY bucket;
  `;

  function count(events: string) {
    const { data, hasError } = sql<{ count: number }>`
      SELECT COALESCE(SUM(occurence_count), 0) AS count
      FROM activity
      WHERE event_name IN (${events})
      AND day BETWEEN '${start}' AND '${end}';
    `;
    return hasError ? null : data[0].count;
  }

  const byHour = Array.from({ length: 24 }, () => 0);
  for (const { label, value } of chartData ?? []) byHour[label] = value;

  const data: ShareData = {
    seed: CRC32.str(user.package_id ?? "") >>> 0,
    user: {
      displayName: user.package_owner_display_name,
      handle: handleOf(user.package_owner_name ?? ""),
      avatar: cdnPNG(user.package_owner_avatar_url, 512),
    },
    range: { id: timeRange, start, end },
    messages: {
      total: usage.messageCount(),
      perDay: usage.avgMessageCountPerDay(),
      series: seriesQuery.hasError
        ? []
        : fillSeries(seriesQuery.data, start, end, bucket),
      bucket,
    },
    topDMs: dms.map((dm, i) => {
      const details =
        userQueries[i]?.data ??
        usersCache.find((cached) => cached.user_id === dm.dm_user_id);
      return {
        id: dm.dm_user_id,
        name: details?.display_name || dm.user_name,
        count: dm.message_count,
        avatar: cdnPNG(
          avatarURLFallback(
            details?.avatar_url || dm.user_avatar_url,
            dm.dm_user_id,
          ),
          256,
        ),
      };
    }),
    topServers: guilds.map((guild, i) => {
      const widget = widgetQueries[i]?.data;
      return {
        id: guild.guild_id,
        name: guild.guild_name,
        count: guild.message_count,
        icon:
          widget && widget.error === undefined
            ? cdnPNG(widget.icon_url, 256)
            : null,
      };
    }),
    byHour,
    time: partial
      ? null
      : {
          minutes: usage.totalSessionDuration(),
          appOpens: usage.appStarted(),
          voiceMinutes: (usage.timeSpentVoice() ?? 0) / 60_000,
          avgSessionMinutes: usage.avgSessionDuration(),
        },
    // A partial package has no activity stream at all.
    habits: partial
      ? {
          reactions: null,
          edits: null,
          notifications: null,
          slashCommands: null,
          voiceMessages: null,
          captchas: null,
          logins: null,
          appsAuthorized: null,
        }
      : {
          reactions: count("'add_reaction'"),
          edits: usage.messageEdited(),
          notifications: usage.notificationClicked(),
          // The processor keeps only `application_command_used`, which
          // `reporting` never carries.
          slashCommands: reducedExport
            ? null
            : count("'application_command_used'"),
          voiceMessages: usage.voiceMessageRecorded(),
          captchas: usage.captchaServed(),
          logins: usage.loginSuccessful(),
          appsAuthorized: usage.oauth2Authorized(),
        },
    dmCount: topDMsData.count,
    serverCount: topGuildsData.count,
  };

  // Names and icons still on their way: drawing now would draw it twice.
  const loading = [...userQueries, ...widgetQueries].some(
    (query) => query.isPending,
  );

  return { data, loading };
}
