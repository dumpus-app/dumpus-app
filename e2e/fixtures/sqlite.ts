import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import initSqlJs from "sql.js";
import type { Dataset } from "./dataset";

// Copied from `processor/sqlitedb/sqlitedb.go`, the schema `src/types/sql.ts`
// describes.
const SCHEMA = `
  CREATE TABLE activity (
    event_name TEXT NOT NULL,
    day TEXT NOT NULL,
    hour INTEGER,
    occurence_count INTEGER NOT NULL,
    associated_user_id TEXT,
    associated_channel_id TEXT,
    associated_guild_id TEXT,
    extra_field_1 TEXT,
    extra_field_2 TEXT,
    PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id, associated_user_id, extra_field_1)
  );
  CREATE TABLE dm_channels_data (
    channel_id TEXT NOT NULL,
    dm_user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    display_name TEXT,
    user_avatar_url TEXT,
    total_message_count INTEGER NOT NULL,
    total_voice_channel_duration INTEGER NOT NULL,
    sentiment_score REAL NOT NULL,
    PRIMARY KEY (channel_id)
  );
  CREATE TABLE guild_channels_data (
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    total_message_count INTEGER NOT NULL,
    total_voice_channel_duration INTEGER NOT NULL,
    PRIMARY KEY (channel_id)
  );
  CREATE TABLE guilds (
    guild_id TEXT NOT NULL,
    guild_name TEXT NOT NULL,
    total_message_count INTEGER NOT NULL,
    PRIMARY KEY (guild_id)
  );
  CREATE TABLE payments (
    payment_id TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    payment_amount INTEGER NOT NULL,
    payment_currency TEXT NOT NULL,
    payment_description TEXT NOT NULL,
    PRIMARY KEY (payment_id)
  );
  CREATE TABLE voice_sessions (
    channel_id TEXT NOT NULL,
    guild_id TEXT,
    duration_mins INTEGER NOT NULL,
    started_date TEXT NOT NULL,
    ended_date TEXT NOT NULL,
    PRIMARY KEY (channel_id, started_date)
  );
  CREATE TABLE sessions (
    started_date TEXT NOT NULL,
    ended_date TEXT NOT NULL,
    duration_mins INTEGER NOT NULL,
    device_os TEXT NOT NULL
  );
  CREATE TABLE package_data (
    package_id TEXT NOT NULL,
    package_version TEXT NOT NULL,
    package_owner_id TEXT NOT NULL,
    package_owner_name TEXT NOT NULL,
    package_owner_display_name TEXT,
    package_owner_avatar_url TEXT,
    package_is_partial BOOLEAN NOT NULL DEFAULT 0
  );
`;

const INDEXES = `
  CREATE INDEX idx_activity_event_guild_day ON activity (event_name, associated_guild_id, day);
  CREATE INDEX idx_activity_event_channel_day ON activity (event_name, associated_channel_id, day);
  CREATE INDEX idx_sessions_started_date ON sessions (started_date);
  CREATE INDEX idx_voice_sessions_started_date ON voice_sessions (started_date);
  CREATE INDEX idx_dm_channels_dm_user_id ON dm_channels_data (dm_user_id);
  CREATE INDEX idx_guild_channels_guild_id ON guild_channels_data (guild_id);
`;

/** SQLite file the worker would produce for this dataset, before gzip. */
export async function buildDatabase({ tables }: Dataset) {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  try {
    db.run(SCHEMA);
    db.run("BEGIN");
    for (const [table, rows] of Object.entries(tables)) {
      if (rows.length === 0) continue;
      const columns = Object.keys(rows[0]);
      const insert = db.prepare(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns
          .map(() => "?")
          .join(", ")})`,
      );
      for (const row of rows as Record<string, string | number | null>[]) {
        insert.run(columns.map((column) => row[column]));
      }
      insert.free();
    }
    db.run("COMMIT");
    db.run(INDEXES);
    db.run("VACUUM");
    return db.export();
  } finally {
    db.close();
  }
}

/**
 * Blob as the worker uploads it: gzip, then AES-256-CBC with SHA-256 of the
 * UPN as the key and a random IV, PKCS7 padded (see `encrypt_sqlite_data()`
 * in `api/src/crypto.py`). The demo is stored unencrypted.
 */
export function packBlob(database: Uint8Array, upn: string | null) {
  const gzipped = gzipSync(database);
  if (upn === null) return { body: gzipped, iv: null };

  const key = createHash("sha256").update(upn).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const body = Buffer.concat([cipher.update(gzipped), cipher.final()]);
  return { body, iv: iv.toString("hex") };
}
