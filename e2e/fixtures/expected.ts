import {
  LAST_DAY,
  daySeconds,
  rangeStart,
  type ActivityRow,
  type Dataset,
  type RangeID,
} from "./dataset";

// What the app should display for a dataset, computed straight from the
// fixture rows with plain JS, so it doesn't share code with the SQL in
// `src/hooks/data`. Formatting mirrors `src/utils/format.ts` for `en-US`.

export function compact(n: number | null) {
  return n === null
    ? "N/A"
    : new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

export function standard(n: number | null) {
  return n === null ? "N/A" : new Intl.NumberFormat("en-US").format(n);
}

export function hour(h: number) {
  const date = new Date(Date.UTC(2024, 0, 1, h));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function duration(ms: number, short = false) {
  if (!ms) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return short ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return short ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function sumBy<T>(
  rows: T[],
  key: (row: T) => string | null,
  value: (row: T) => number,
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (k === null) continue;
    totals.set(k, (totals.get(k) ?? 0) + value(row));
  }
  return totals;
}

function argmax(totals: Map<string, number>) {
  const sorted = Array.from(totals).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) {
    throw new Error(`fixture tie between ${sorted[0][0]} and ${sorted[1][0]}`);
  }
  return sorted[0]?.[0];
}

export function expectations(dataset: Dataset, range: RangeID) {
  const { tables } = dataset;
  const start = rangeStart(range);
  const end = LAST_DAY;
  const inRange = (row: ActivityRow) => row.day >= start && row.day <= end;
  const events = (name: string) =>
    tables.activity.filter((row) => row.event_name === name && inRange(row));
  const messages = events("message_sent");
  // `SUM()` over no rows is NULL, which the app shows as "N/A".
  const count = (rows: ActivityRow[]) =>
    rows.length ? sum(rows.map((r) => r.occurence_count)) : null;

  // The app compares these TEXT timestamps to strings of whole seconds.
  const startText = `${daySeconds(start)}`;
  const endText = `${daySeconds(end)}`;
  const between = (value: string) => value >= startText && value <= endText;
  const sessions = tables.sessions.filter((s) => between(s.started_date));
  const calls = tables.voice_sessions.filter((s) => between(s.started_date));

  const topHourOf = (rows: ActivityRow[]) => {
    const top = argmax(
      sumBy(
        rows,
        (r) => `${r.hour}`,
        (r) => r.occurence_count,
      ),
    );
    return top === undefined ? "N/A" : hour(Number(top));
  };
  const averagePerDay = (rows: ActivityRow[]) => {
    const days = sumBy(
      rows,
      (r) => r.day,
      (r) => r.occurence_count,
    );
    return Math.round(sum(Array.from(days.values())) / days.size);
  };

  const dmByChannel = new Map(
    tables.dm_channels_data.map((dm) => [dm.channel_id, dm]),
  );
  const channelByID = new Map(
    tables.guild_channels_data.map((channel) => [channel.channel_id, channel]),
  );
  const guildByID = new Map(
    tables.guilds.map((guild) => [guild.guild_id, guild]),
  );

  const ranked = <T>(
    totals: Map<string, number>,
    describe: (id: string) => T,
  ) =>
    Array.from(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([id, total], i) => ({ ...describe(id), id, total, rank: i + 1 }));

  const topDMs = ranked(
    sumBy(
      messages,
      (r) => dmByChannel.get(r.associated_channel_id ?? "")?.dm_user_id ?? null,
      (r) => r.occurence_count,
    ),
    (userID) => {
      const dm = tables.dm_channels_data.find((d) => d.dm_user_id === userID)!;
      // The app shows the display name from `/user`, else the username.
      return {
        name: dataset.apiUsers.get(userID)?.display_name ?? dm.user_name,
      };
    },
  );
  const topGuilds = ranked(
    sumBy(
      messages,
      (r) => r.associated_guild_id,
      (r) => r.occurence_count,
    ),
    (guildID) => ({ name: guildByID.get(guildID)!.guild_name }),
  );
  const topChannels = ranked(
    sumBy(
      messages,
      (r) => (r.associated_guild_id ? r.associated_channel_id : null),
      (r) => r.occurence_count,
    ),
    (channelID) => {
      const channel = channelByID.get(channelID)!;
      return {
        name: `#${channel.channel_name}`,
        guildID: channel.guild_id,
        guildName: guildByID.get(channel.guild_id)!.guild_name,
      };
    },
  );

  const appOpenedEver = tables.activity.filter(
    (r) => r.event_name === "app_opened",
  );

  return {
    messagesSent: count(messages),
    joinedServers: new Set(
      events("guild_joined").map((r) => r.associated_guild_id),
    ).size,
    receivedCalls: calls.length,
    topHour: topHourOf(messages),
    knownUsers: new Set(tables.dm_channels_data.map((dm) => dm.dm_user_id))
      .size,
    appStarted: count(events("app_opened")),
    messagesPerDay: averagePerDay(messages),
    // Not filtered by time range in the app.
    appOpeningsPerDay: averagePerDay(appOpenedEver),
    // Integer division in SQL: `SUM(payment_amount) / 100`.
    spentMoney: Math.trunc(
      sum(tables.payments.map((p) => p.payment_amount)) / 100,
    ),
    avgSessionMinutes: sessions.length
      ? sum(sessions.map((s) => s.duration_mins)) / sessions.length
      : 0,
    totalSessionMinutes: sum(sessions.map((s) => s.duration_mins)),
    voiceMinutes: sum(calls.map((s) => s.duration_mins)),
    event: (name: string) => count(events(name)),
    topDMs,
    topGuilds,
    topChannels,
    dm(userID: string) {
      const dm = tables.dm_channels_data.find((d) => d.dm_user_id === userID)!;
      const rows = messages.filter(
        (r) => r.associated_channel_id === dm.channel_id,
      );
      return {
        hasData: rows.length > 0,
        messages: count(rows),
        topHour: topHourOf(rows),
        reactions: count(
          events("add_reaction").filter(
            (r) => r.associated_channel_id === dm.channel_id,
          ),
        ),
        sentiment: dm.sentiment_score,
      };
    },
    guild(guildID: string) {
      const rows = messages.filter((r) => r.associated_guild_id === guildID);
      const bots = ranked(
        sumBy(
          events("application_command_used").filter(
            (r) => r.associated_guild_id === guildID,
          ),
          (r) => r.associated_user_id,
          (r) => r.occurence_count,
        ),
        (botID) => ({
          name: dataset.apiUsers.get(botID)?.display_name ?? null,
        }),
      );
      return {
        hasData: rows.length > 0,
        messages: count(rows),
        // `IFNULL(SUM(occurence_count), 0)`
        joins:
          count(
            events("guild_joined").filter(
              (r) => r.associated_guild_id === guildID,
            ),
          ) ?? 0,
        topHour: topHourOf(rows),
        bots,
        channels: topChannels.filter((c) => c.guildID === guildID),
      };
    },
    channel(channelID: string) {
      const channel = channelByID.get(channelID)!;
      const rows = messages.filter(
        (r) => r.associated_channel_id === channelID,
      );
      return {
        hasData: rows.length > 0,
        messages: count(rows),
        topHour: topHourOf(rows),
        reactions: count(
          events("add_reaction").filter(
            (r) => r.associated_channel_id === channelID,
          ),
        ),
        guildMessages: count(
          messages.filter((r) => r.associated_guild_id === channel.guild_id),
        ),
      };
    },
  };
}
