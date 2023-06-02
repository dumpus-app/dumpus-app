// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L388
export type Activity = {
  event_name: string;
  day: string;
  hour?: number;
  occurence_count: number;
  associated_dm_user_id?: string;
  associated_channel_id?: string;
  associated_guild_id?: string;
};

// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L401
export type DmChannelsData = {
  channel_id: string;
  dm_user_id: string;
  user_name: string;
  user_avatar_url?: string;
  total_message_count: number;
  total_voice_channel_duration: number;
};

// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L413
export type GuildChannelsData = {
  channel_id: string;
  channel_name: string;
  guild_id: string;
  total_message_count: number;
  total_voice_channel_duration: number;
};

// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L424
export type Guild = {
  guild_id: string;
  guild_name: string;
  total_message_count: number;
};

// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L433
export type Payment = {
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  payment_currency: string;
  payment_description: string;
};

// https://github.com/dumpus-app/dumpus-api/blob/main/tasks.py#L444
export type VoiceSession = {
  channel_id: string;
  guild_id?: string;
  duration_mins: number;
  started_date: string;
  ended_date: string;
};
