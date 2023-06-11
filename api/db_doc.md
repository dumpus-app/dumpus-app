**Table: activity**
| event_name | day | hour | occurence_count | associated_dm_user_id | associated_channel_id | associated_guild_id |
| ------------ | ----- | ----- | ------------------- | ----------------------- | -------------------- | ----------------- |
|description of the event_name column | description of the day column | description of the hour column | description of the occurence_count column | description of the associated_dm_user_id column | description of the associated_channel_id column | description of the associated_guild_id column |

**Table: dm_channels_data**
| channel_id | dm_user_id | user_name | user_avatar_url | total_message_count | total_voice_channel_duration | sentiment_score |
| ----------- | ---------- | --------- | --------------- | ------------------ | ----------------------------- | --------------- |
|description of the channel_id column | description of the dm_user_id column | description of the user_name column | description of the user_avatar_url column | description of the total_message_count column | description of the total_voice_channel_duration column | description of the sentiment_score column |

**Table: guild_channels_data**
| channel_id | channel_name | guild_id | total_message_count | total_voice_channel_duration |
| ---------- | ------------ | -------- | ------------------ | ----------------------------- |
|description of the channel_id column | description of the channel_name column | description of the guild_id column | description of the total_message_count column | description of the total_voice_channel_duration column |

**Table: guilds**
| guild_id | guild_name | total_message_count |
| -------- | ---------- | ------------------- |
|description of the guild_id column | description of the guild_name column | description of the total_message_count column |

**Table: payments**
| payment_id | payment_date | payment_amount | payment_currency | payment_description |
| ---------- | ------------ | -------------- | ---------------- | ------------------- |
|description of the payment_id column | description of the payment_date column | description of the payment_amount column | description of the payment_currency column | description of the payment_description column |

**Table: voice_sessions**
| channel_id | guild_id | duration_mins | started_date | ended_date |
| ---------- | -------- | ------------ | ------------ | ---------- |
|description of the channel_id column | description of the guild_id column | description of the duration_mins column | description of the started_date column | description of the ended_date column |