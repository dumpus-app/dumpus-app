"use client";

import type { PackageData } from "~/types/sql";
import type useSQL from "../use-sql";

// The event types Discord's `reporting` activity stream never carries.
const NOT_IN_REPORTING = new Set([
  "notification_clicked",
  "join_call",
  "message_edited",
  "slash_command_used",
  "application_command_used",
  "email_opened",
  "user_avatar_updated",
  "app_crashed",
  "app_native_crash",
  "voice_message_recorded",
  "premium_upsell_viewed",
  "remote_auth_login",
]);

/**
 * Whether the package's export says how often `eventName` happened. Some
 * exports only have the `reporting` activity stream, which never carries the
 * types above: the stats of those types are null ("not available") for them,
 * where no rows would otherwise mean 0. The processor writes the stream it read
 * to `package_data.activity_stream`; a database processed before has no such
 * column and reads as carrying every type.
 */
export function carriesEvent(
  sql: ReturnType<typeof useSQL>,
  eventName: string,
) {
  // `SELECT *`, since older databases have no `activity_stream`.
  const { data } = sql<PackageData>`SELECT * FROM package_data LIMIT 1;`;
  return !(
    data?.[0]?.activity_stream === "reporting" &&
    NOT_IN_REPORTING.has(eventName)
  );
}
