// https://github.com/dumpus-app/dumpus-api/blob/main/docs/sqlite_database_structure.md

export type Activity = {
  event_name: string;
  day: string;
  hour?: number;
  occurence_count: number;
  associated_user_id?: string;
  associated_channel_id?: string;
  associated_guild_id?: string;
};

export type DmChannelsData = {
  channel_id: string;
  dm_user_id: string;
  user_name: string;
  display_name?: string;
  user_avatar_url?: string;
  total_message_count: number;
  total_voice_channel_duration: number;
  sentiment_score: number;
};

export type GuildChannelsData = {
  channel_id: string;
  channel_name: string;
  guild_id: string;
  total_message_count: number;
  total_voice_channel_duration: number;
};

export type Guild = {
  guild_id: string;
  guild_name: string;
  total_message_count: number;
};

export type Payment = {
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  payment_currency: string;
  payment_description: string;
};

export type VoiceSession = {
  channel_id: string;
  guild_id?: string;
  duration_mins: number;
  started_date: string;
  ended_date: string;
};

export type PackageData = {
  package_id: string;
  package_version: string;
  package_owner_id: string;
  package_owner_name: string;
  package_owner_display_name: string;
  package_owner_avatar_url: string;
  package_is_partial: boolean;
};
