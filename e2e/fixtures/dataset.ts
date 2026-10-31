import { createHash } from "node:crypto";

// Synthetic Discord packages for the e2e suite. Every name and id below is
// made up, and every row comes from a seeded PRNG, so two runs produce the
// same database.

const FIRST_DAY = "2023-04-01";
const LAST_DAY = "2024-06-30";

export type ActivityRow = {
  event_name: string;
  day: string;
  hour: number;
  occurence_count: number;
  associated_user_id: string | null;
  associated_channel_id: string | null;
  associated_guild_id: string | null;
  extra_field_1: string | null;
  extra_field_2: string | null;
};

export type DmChannelRow = {
  channel_id: string;
  dm_user_id: string;
  user_name: string;
  display_name: string | null;
  user_avatar_url: string | null;
  total_message_count: number;
  total_voice_channel_duration: number;
  sentiment_score: number;
};

export type GuildChannelRow = {
  channel_id: string;
  channel_name: string;
  guild_id: string;
  total_message_count: number;
  total_voice_channel_duration: number;
};

export type GuildRow = {
  guild_id: string;
  guild_name: string;
  total_message_count: number;
};

export type PaymentRow = {
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  payment_currency: string;
  payment_description: string;
};

export type VoiceSessionRow = {
  channel_id: string;
  guild_id: string | null;
  duration_mins: number;
  started_date: string;
  ended_date: string;
};

export type SessionRow = {
  started_date: string;
  ended_date: string;
  duration_mins: number;
  device_os: string;
};

export type PackageDataRow = {
  package_id: string;
  package_version: string;
  package_owner_id: string;
  package_owner_name: string;
  package_owner_display_name: string | null;
  package_owner_avatar_url: string | null;
  package_is_partial: number;
};

/** Body of the mocked `GET /process/:id/user/:userID` for a known user. */
export type ApiUser = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string;
};

/** Body of the mocked `GET /widget/:guildID` for a guild the bot can see. */
export type ApiWidget = {
  name: string;
  icon_url: string;
  member_count: number;
};

export type Dataset = {
  packageId: string;
  /** Key of the package link, `null` for the demo which has no link. */
  upn: string | null;
  tables: {
    activity: ActivityRow[];
    dm_channels_data: DmChannelRow[];
    guild_channels_data: GuildChannelRow[];
    guilds: GuildRow[];
    payments: PaymentRow[];
    voice_sessions: VoiceSessionRow[];
    sessions: SessionRow[];
    package_data: PackageDataRow[];
  };
  apiUsers: Map<string, ApiUser>;
  widgets: Map<string, ApiWidget>;
};

// Real UPNs are 500+ url-safe characters, see `discord_link_regex` in
// `api/src/util.py`.
const FAKE_UPN =
  "e2e.fake-upn." + "0123456789abcdefghijklmnopqrstuvwxyz".repeat(14);
export const FAKE_PACKAGE_LINK = `https://click.discord.com/ls/click?upn=${FAKE_UPN}`;

export function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = ReturnType<typeof mulberry32>;

function int(random: Random, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: Random, items: readonly T[]) {
  return items[Math.floor(random() * items.length)];
}

function addDays(day: string, n: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

function daySeconds(day: string) {
  return Date.parse(`${day}T00:00:00Z`) / 1000;
}

function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

// Python's sqlite3 binds the worker's float timestamps into TEXT columns,
// which SQLite stores as `1688198460.0`.
function timestampText(seconds: number) {
  return `${seconds}.0`;
}

function snowflake(prefix: number, n: number) {
  return `${prefix}${String(n).padStart(17, "0")}`;
}

function avatarURL(userID: string) {
  return `https://cdn.discordapp.com/avatars/${userID}/${md5(userID)}.webp`;
}

type Talker = {
  username: string;
  /** `null` when the mocked user API can't resolve the account. */
  displayName: string | null;
  from: string;
  to: string;
  /** Chance of exchanging messages on a given day. */
  chance: number;
  /** Every active day has its biggest burst at this hour. */
  hour: number;
  sentiment: number;
};

type Community = {
  name: string;
  joined: string[];
  from?: string;
  to?: string;
  hour: number;
  members: number | null;
  bots: string[];
  channels: [name: string, chance: number][];
};

type Bot = { username: string; displayName: string };

type Owner = {
  id: string;
  username: string;
  displayName: string;
  avatarURL: string;
};

type Recipe = {
  seed: number;
  /** First digit of every id, so two packages never share one. */
  prefix: number;
  packageId: string;
  upn: string | null;
  owner: Owner;
  /** Whether the API answers `/user` lookups, it never does for the demo. */
  resolvesUsers: boolean;
  talkers: Talker[];
  /** Contacts with an open DM channel but no message in the package. */
  silentContacts: string[];
  communities: Community[];
  bots: Bot[];
  payments: PaymentRow[];
};

const EMOJIS = ["👍", "😂", "🔥", "❤️", "👀", "🎉"];
const DEVICES = ["windows", "windows", "android", "android", "ios"];
const SPARSE_EVENTS: [event: string, chance: number, max: number][] = [
  ["notification_clicked", 0.3, 3],
  ["email_opened", 0.05, 1],
  ["login_successful", 0.02, 1],
  ["user_avatar_updated", 0.005, 1],
  ["app_crashed", 0.01, 1],
  ["oauth2_authorize_accepted", 0.01, 1],
  ["voice_message_recorded", 0.03, 2],
  ["message_reported", 0.003, 1],
  ["message_edited", 0.4, 4],
  ["premium_upsell_viewed", 0.1, 2],
  ["captcha_served", 0.01, 1],
];

function build(recipe: Recipe): Dataset {
  const random = mulberry32(recipe.seed);
  const id = (kind: number, n: number) =>
    snowflake(recipe.prefix * 10 + kind, n);
  const activity = new Map<string, ActivityRow>();

  function add(
    row: Omit<ActivityRow, "extra_field_2"> & { extra_field_2?: string | null },
  ) {
    const full = { extra_field_2: null, ...row };
    // Mirrors the `activity` primary key, so no two rows collide.
    const key = [
      full.event_name,
      full.day,
      full.hour,
      full.associated_channel_id,
      full.associated_guild_id,
      full.associated_user_id,
      full.extra_field_1,
    ].join("|");
    const existing = activity.get(key);
    if (existing) existing.occurence_count += full.occurence_count;
    else activity.set(key, full);
  }

  function chat({
    channelID,
    guildID,
    from,
    to,
    chance,
    hour,
  }: {
    channelID: string;
    guildID: string | null;
    from: string;
    to: string;
    chance: number;
    hour: number;
  }) {
    const activeDays: string[] = [];
    const start = from > FIRST_DAY ? from : FIRST_DAY;
    const end = to < LAST_DAY ? to : LAST_DAY;
    for (const day of eachDay(start, end)) {
      if (random() >= chance) continue;
      activeDays.push(day);
      const base = {
        event_name: "message_sent",
        day,
        associated_user_id: null,
        associated_channel_id: channelID,
        associated_guild_id: guildID,
        extra_field_1: null,
      };
      // The prime hour beats the channel's other hours on every day, so the
      // "top chat hour" stat has one right answer, even for the DM query
      // that sorts hours by a single row's count instead of their sum.
      add({ ...base, hour, occurence_count: int(random, 12, 30) });
      if (random() < 0.5) {
        add({
          ...base,
          hour: (hour + int(random, 1, 23)) % 24,
          occurence_count: int(random, 1, 8),
        });
      }
      if (random() < 0.2) {
        add({
          event_name: "add_reaction",
          day,
          hour: int(random, 0, 23),
          occurence_count: int(random, 1, 3),
          associated_user_id: null,
          associated_channel_id: channelID,
          associated_guild_id: null,
          extra_field_1: pick(random, EMOJIS),
          extra_field_2: "0",
        });
      }
    }
    return activeDays;
  }

  const ownerID = recipe.owner.id;
  const apiUsers = new Map<string, ApiUser>();
  const widgets = new Map<string, ApiWidget>();
  if (recipe.resolvesUsers) {
    apiUsers.set(ownerID, {
      user_id: ownerID,
      username: recipe.owner.username,
      display_name: recipe.owner.displayName,
      avatar_url: recipe.owner.avatarURL,
    });
  }

  const dmChannels: DmChannelRow[] = [];
  recipe.talkers.forEach((talker, i) => {
    const userID = id(1, i + 1);
    const channelID = id(2, i + 1);
    const known = recipe.resolvesUsers && talker.displayName !== null;
    if (known) {
      apiUsers.set(userID, {
        user_id: userID,
        username: talker.username,
        display_name: talker.displayName,
        avatar_url: avatarURL(userID),
      });
    }
    chat({ channelID, guildID: null, ...talker });
    dmChannels.push({
      channel_id: channelID,
      dm_user_id: userID,
      user_name: talker.username,
      display_name: talker.displayName,
      user_avatar_url: known ? avatarURL(userID) : null,
      total_message_count: 0,
      total_voice_channel_duration: 0,
      sentiment_score: talker.sentiment,
    });
  });
  recipe.silentContacts.forEach((username, i) => {
    const n = recipe.talkers.length + i + 1;
    dmChannels.push({
      channel_id: id(2, n),
      dm_user_id: id(1, n),
      user_name: username,
      display_name: null,
      user_avatar_url: null,
      total_message_count: 0,
      total_voice_channel_duration: 0,
      sentiment_score: 0,
    });
  });

  const botIDs = new Map<string, string>();
  recipe.bots.forEach((bot, i) => {
    const botID = id(4, i + 1);
    botIDs.set(bot.username, botID);
    if (recipe.resolvesUsers) {
      apiUsers.set(botID, {
        user_id: botID,
        username: bot.username,
        display_name: bot.displayName,
        avatar_url: avatarURL(botID),
      });
    }
  });

  const guilds: GuildRow[] = [];
  const guildChannels: GuildChannelRow[] = [];
  const voiceChannels: [channelID: string, guildID: string | null][] = [];
  let channelCount = 0;
  recipe.communities.forEach((community, i) => {
    const guildID = id(3, i + 1);
    guilds.push({
      guild_id: guildID,
      guild_name: community.name,
      total_message_count: 0,
    });
    if (community.members !== null) {
      widgets.set(guildID, {
        name: community.name,
        icon_url: `https://cdn.discordapp.com/icons/${guildID}/${md5(guildID)}.png`,
        member_count: community.members,
      });
    }
    for (const day of community.joined) {
      add({
        event_name: "guild_joined",
        day,
        hour: int(random, 10, 22),
        occurence_count: 1,
        associated_user_id: null,
        associated_channel_id: null,
        associated_guild_id: guildID,
        extra_field_1: null,
      });
    }
    let busiestDays: string[] = [];
    for (const [name, chance] of community.channels) {
      channelCount++;
      const channelID = id(5, channelCount);
      guildChannels.push({
        channel_id: channelID,
        channel_name: name,
        guild_id: guildID,
        total_message_count: 0,
        total_voice_channel_duration: 0,
      });
      if (name.endsWith("-vc") || channelCount % 5 === 0) {
        voiceChannels.push([channelID, guildID]);
      }
      const days = chat({
        channelID,
        guildID,
        from: community.from ?? community.joined[0],
        to: community.to ?? LAST_DAY,
        chance,
        hour: community.hour,
      });
      if (days.length > busiestDays.length) busiestDays = days;
    }
    for (const day of busiestDays) {
      for (const bot of community.bots) {
        if (random() >= 0.3) continue;
        add({
          event_name: "application_command_used",
          day,
          hour: int(random, 0, 23),
          occurence_count: int(random, 1, 4),
          associated_user_id: botIDs.get(bot)!,
          associated_channel_id: null,
          associated_guild_id: guildID,
          extra_field_1: null,
        });
      }
    }
  });
  for (const dm of dmChannels.slice(0, 3))
    voiceChannels.push([dm.channel_id, null]);

  const sessions: SessionRow[] = [];
  const voiceSessions: VoiceSessionRow[] = [];
  for (const day of eachDay(FIRST_DAY, LAST_DAY)) {
    const openedHours = new Set<number>();
    const openings = int(random, 2, 4);
    while (openedHours.size < openings) openedHours.add(int(random, 7, 23));
    for (const hour of openedHours) {
      add({
        event_name: "app_opened",
        day,
        hour,
        occurence_count: int(random, 1, 6),
        associated_user_id: null,
        associated_channel_id: null,
        associated_guild_id: null,
        extra_field_1: pick(random, DEVICES),
      });
    }
    for (const [event, chance, max] of SPARSE_EVENTS) {
      if (random() >= chance) continue;
      add({
        event_name: event,
        day,
        hour: int(random, 0, 23),
        occurence_count: int(random, 1, max),
        associated_user_id: null,
        associated_channel_id: null,
        associated_guild_id: null,
        extra_field_1: null,
      });
    }

    // Sessions start on whole minutes after 07:01, never on a range bound.
    const midnight = daySeconds(day);
    let cursor = midnight + 7 * 3600 + 60;
    for (let i = int(random, 1, 3); i > 0; i--) {
      const started = cursor + int(random, 0, 180) * 60;
      const minutes = int(random, 4, 150);
      sessions.push({
        started_date: timestampText(started),
        ended_date: timestampText(started + minutes * 60 + int(random, 0, 59)),
        duration_mins: minutes,
        device_os: pick(random, DEVICES),
      });
      cursor = started + (minutes + 30) * 60;
    }
    if (voiceChannels.length > 0 && random() < 0.15) {
      const [channelID, guildID] = pick(random, voiceChannels);
      const started = midnight + int(random, 18 * 60, 22 * 60) * 60;
      const minutes = int(random, 5, 240);
      voiceSessions.push({
        channel_id: channelID,
        guild_id: guildID,
        duration_mins: minutes,
        started_date: timestampText(started),
        ended_date: timestampText(started + minutes * 60 + int(random, 0, 59)),
      });
    }
  }

  const rows = Array.from(activity.values());
  for (const row of rows) {
    if (row.event_name !== "message_sent") continue;
    const dm = dmChannels.find(
      (c) => c.channel_id === row.associated_channel_id,
    );
    if (dm) dm.total_message_count += row.occurence_count;
    const channel = guildChannels.find(
      (c) => c.channel_id === row.associated_channel_id,
    );
    if (channel) channel.total_message_count += row.occurence_count;
    const guild = guilds.find((g) => g.guild_id === row.associated_guild_id);
    if (guild) guild.total_message_count += row.occurence_count;
  }

  return {
    packageId: recipe.packageId,
    upn: recipe.upn,
    tables: {
      activity: rows,
      dm_channels_data: dmChannels,
      guild_channels_data: guildChannels,
      guilds,
      payments: recipe.payments,
      voice_sessions: voiceSessions,
      sessions,
      package_data: [
        {
          package_id: recipe.packageId,
          package_version: "0.1.0",
          package_owner_id: ownerID,
          package_owner_name: recipe.owner.username,
          package_owner_display_name: recipe.owner.displayName,
          package_owner_avatar_url: recipe.owner.avatarURL,
          package_is_partial: 0,
        },
      ],
    },
    apiUsers,
    widgets,
  };
}

// prettier-ignore
const TALKER_TABLE = [
  ["pixel_otter", "Pixel Otter", FIRST_DAY, LAST_DAY, 0.8, 21, 0.734],
  ["moss.kettle", "Moss Kettle", FIRST_DAY, "2024-01-31", 0.95, 22, 0.412],
  ["brindlefox", "Brindle Fox", FIRST_DAY, LAST_DAY, 0.45, 13, -0.268],
  ["quartz_lantern", "Quartz Lantern", "2024-02-15", LAST_DAY, 0.9, 19, 0.581],
  ["tidal.sprout", "Tidal Sprout", "2024-06-03", LAST_DAY, 1, 18, 0.903],
  ["ember_finch", "Ember Finch", "2023-06-01", "2024-05-15", 0.35, 20, 0.157],
  ["cobalt.wren", "Cobalt Wren", FIRST_DAY, "2023-11-30", 0.5, 23, -0.512],
  ["sable_comet", "Sable Comet", "2023-09-01", LAST_DAY, 0.3, 12, 0.322],
  ["velvet.hopper", "Velvet Hopper", FIRST_DAY, LAST_DAY, 0.2, 9, 0.045],
  ["juniper_byte", "Juniper Byte", "2023-12-01", LAST_DAY, 0.25, 17, 0.688],
  ["aster.drift", "Aster Drift", "2023-05-10", "2024-03-20", 0.18, 16, -0.09],
  ["rook_and_reed", "Rook Reed", FIRST_DAY, "2023-08-15", 0.4, 14, 0.271],
  ["lumen.badger", "Lumen Badger", "2023-10-01", LAST_DAY, 0.12, 22, 0.512],
  ["saffron_gale", "Saffron Gale", "2024-04-01", LAST_DAY, 0.3, 11, -0.344],
  ["nimbus.pike", "Nimbus Pike", FIRST_DAY, LAST_DAY, 0.08, 20, 0.19],
  ["fern_static", "Fern Static", "2023-07-01", "2024-02-28", 0.15, 10, 0.605],
  ["glacier.mint", "Glacier Mint", "2024-01-10", LAST_DAY, 0.1, 15, -0.71],
  ["hazel_rocket", "Hazel Rocket", FIRST_DAY, "2023-06-30", 0.3, 19, 0.33],
  ["indigo.moth", "Indigo Moth", "2023-11-01", LAST_DAY, 0.07, 21, 0.088],
  ["kelp_orbit", "Kelp Orbit", "2023-04-15", "2024-06-01", 0.05, 8, 0.4],
  ["lichen.spark", null, FIRST_DAY, LAST_DAY, 0.06, 18, 0.25],
  ["marble_heron", null, "2023-08-01", LAST_DAY, 0.09, 13, -0.15],
  ["onyx.puffin", null, "2024-05-20", LAST_DAY, 0.4, 23, 0.811],
  ["pebble_quasar", null, FIRST_DAY, "2023-12-31", 0.04, 7, -0.402],
] as const;

const MAIN_TALKERS = TALKER_TABLE.map(
  ([username, displayName, from, to, chance, hour, sentiment]): Talker => ({
    username,
    displayName,
    from,
    to,
    chance,
    hour,
    sentiment,
  }),
);

const MAIN_COMMUNITIES: Community[] = [
  {
    name: "Synthwave Cafe",
    joined: ["2023-04-02"],
    hour: 22,
    members: 1834,
    bots: ["tunebox"],
    channels: [
      ["general", 0.85],
      ["synth-share", 0.4],
      ["gear-talk", 0.25],
      ["late-night-vc", 0.15],
    ],
  },
  {
    name: "Board Game Night",
    joined: ["2023-04-20"],
    hour: 20,
    members: 312,
    bots: ["diceroller"],
    channels: [
      ["general", 0.6],
      ["rules-lawyering", 0.3],
      ["scheduling", 0.2],
    ],
  },
  {
    name: "Rust Learners",
    joined: ["2023-05-08"],
    hour: 15,
    members: 9420,
    bots: [],
    channels: [
      ["general", 0.5],
      ["help", 0.45],
      ["show-and-tell", 0.15],
      ["jobs", 0.05],
    ],
  },
  {
    name: "Pixel Garden",
    joined: ["2023-07-14"],
    hour: 17,
    members: null,
    bots: ["quizzle", "diceroller", "tunebox"],
    channels: [
      ["general", 0.4],
      ["screenshots", 0.3],
      ["mods", 0.1],
    ],
  },
  {
    name: "Midnight Runners",
    joined: ["2023-04-11", "2023-10-03"],
    hour: 23,
    members: null,
    bots: [],
    channels: [
      ["general", 0.35],
      ["routes", 0.2],
      ["race-results", 0.1],
    ],
  },
  {
    name: "Book Nook",
    joined: ["2024-02-15"],
    hour: 21,
    members: null,
    bots: [],
    channels: [
      ["general", 0.5],
      ["now-reading", 0.35],
      ["spoilers", 0.1],
    ],
  },
  {
    name: "Retro Arcade Club",
    joined: ["2024-06-10"],
    hour: 19,
    members: null,
    bots: ["quizzle"],
    channels: [
      ["general", 0.9],
      ["high-scores", 0.6],
    ],
  },
  {
    name: "Cloud Watchers",
    joined: ["2023-04-05"],
    to: "2023-09-30",
    hour: 8,
    members: null,
    bots: [],
    channels: [
      ["general", 0.3],
      ["photos", 0.2],
    ],
  },
];

export function buildMainDataset() {
  const ownerID = snowflake(90, 1);
  return build({
    seed: 20240630,
    prefix: 9,
    packageId: md5(FAKE_UPN),
    upn: FAKE_UPN,
    owner: {
      id: ownerID,
      username: "nova.quill",
      displayName: "Nova Quill",
      avatarURL: avatarURL(ownerID),
    },
    resolvesUsers: true,
    talkers: MAIN_TALKERS,
    silentContacts: [
      "quiet.walrus",
      "dusty_marigold",
      "slate.kiwi",
      "umber_yak",
    ],
    communities: MAIN_COMMUNITIES,
    bots: [
      { username: "diceroller", displayName: "DiceRoller" },
      { username: "tunebox", displayName: "Tunebox" },
      { username: "quizzle", displayName: "Quizzle" },
    ],
    payments: [
      { day: "2023-05-12", amount: 299, description: "Nitro Basic Monthly" },
      { day: "2023-08-12", amount: 299, description: "Nitro Basic Monthly" },
      { day: "2023-12-24", amount: 9999, description: "Nitro Yearly" },
      { day: "2024-04-02", amount: 499, description: "Server Boost" },
    ].map(({ day, amount, description }, i) => ({
      payment_id: snowflake(96, i + 1),
      payment_date: day,
      payment_amount: amount,
      payment_currency: "usd",
      payment_description: description,
    })),
  });
}

// Shaped like `generate_demo_database()` in `api/src/sqlite.py`: a
// "wumpus" owner, generated usernames and "<username>'s server" guilds.
export function buildDemoDataset() {
  const random = mulberry32(42);
  const colors = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Gold"];
  const animals = ["Lion", "Tiger", "Bear", "Wolf", "Eagle", "Fox", "Cat"];
  const username = () =>
    `${pick(random, colors)}${pick(random, animals)}${int(random, 0, 1000)}`;

  const talkers: Talker[] = Array.from({ length: 12 }, () => {
    const name = username();
    return {
      username: name.toLowerCase(),
      displayName: name,
      from: addDays(FIRST_DAY, int(random, 0, 200)),
      to: addDays(LAST_DAY, -int(random, 0, 150)),
      chance: 0.1 + random() * 0.5,
      hour: int(random, 0, 23),
      sentiment: Math.round((random() * 2 - 1) * 1000) / 1000,
    };
  });
  const communities: Community[] = Array.from({ length: 5 }, () => ({
    name: `${username()}'s server`,
    joined: [addDays(FIRST_DAY, int(random, 0, 300))],
    hour: int(random, 0, 23),
    members: null,
    bots: ["helper"],
    channels: [
      [username().toLowerCase(), 0.3 + random() * 0.3],
      [username().toLowerCase(), 0.1 + random() * 0.2],
    ],
  }));

  return build({
    seed: 7,
    prefix: 8,
    packageId: "demo",
    upn: null,
    owner: {
      id: snowflake(80, 1),
      username: "wumpus",
      displayName: "Wumpus",
      avatarURL: "https://cdn.discordapp.com/embed/avatars/0.png",
    },
    resolvesUsers: false,
    talkers,
    silentContacts: [],
    communities,
    bots: [{ username: "helper", displayName: "Helper" }],
    payments: [],
  });
}
