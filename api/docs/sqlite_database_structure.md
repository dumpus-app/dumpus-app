**activity table**

| Column | Description |
|--------|-------------|
| event_name | The name of the event (e.g. "message_sent") |
| day | The day when the event occurred, in the format "YYYY-MM-DD" |
| hour | The hour when the event occurred (0-23) |
| occurence_count | The number of occurrences of the event during the specified hour |
| associated_dm_user_id | The user ID associated with the event (if applicable) |
| associated_channel_id | The channel ID where the event occurred |
| associated_guild_id | The guild ID where the event occurred (if applicable) |

Example:
| event_name | day | hour | occurence_count | associated_dm_user_id | associated_channel_id | associated_guild_id |
|------------|-----|------|-----------------|-----------------------|----------------------|---------------------|
| message_sent | 2022-06-15 | 10 | 5 | 1234567890 | 2345678901 | 3456789012 |

**dm_channels_data table**

| Column | Description |
|--------|-------------|
| channel_id | The ID of the direct message channel |
| dm_user_id | The ID of the user involved in the direct message conversation |
| user_name | The name of the user involved in the direct message conversation |
| user_avatar_url | The URL of the user's avatar |
| total_message_count | The total number of messages in the direct message channel |
| total_voice_channel_duration | The total duration (in minutes) spent in voice channels connected with the direct message conversation |
| sentiment_score | The sentiment score of the messages in the channel |

Example:
| channel_id | dm_user_id | user_name | user_avatar_url | total_message_count | total_voice_channel_duration | sentiment_score |
|------------|------------|-----------|-----------------|---------------------|------------------------------|-----------------|
| 2345678901 | 1234567890 | user1 | https://avatar.url | 500 | 120 | 0.7 |

**guild_channels_data table**

| Column | Description |
|--------|-------------|
| channel_id | The ID of the guild channel |
| guild_id | The ID of the guild where the channel is located |
| channel_name | The name of the guild channel |
| total_message_count | The total number of messages in the guild channel |
| total_voice_channel_duration | The total duration (in minutes) spent in the voice channel |

Example:
| channel_id | guild_id | channel_name | total_message_count | total_voice_channel_duration |
|------------|----------|--------------|---------------------|------------------------------|
| 2345678901 | 3456789012 | general | 1000 | 200 |

**guilds table**

| Column | Description |
|--------|-------------|
| guild_id | The ID of the guild |
| guild_name | The name of the guild |
| total_message_count | The total number of messages in the guild |

Example:
| guild_id | guild_name | total_message_count |
|----------|------------|---------------------|
| 3456789012 | MyGuild | 5000 |

**payments table**

| Column | Description |
|--------|-------------|
| payment_id | The ID of the payment |
| payment_date | The date when the payment was made, in the format "YYYY-MM-DD" |
| payment_amount | The amount of the payment |
| payment_currency | The currency of the payment |
| payment_description | The description of the payment |

Example:
| payment_id | payment_date | payment_amount | payment_currency | payment_description |
|------------|-------------|----------------|------------------|---------------------|
| 123456 | 2022-06-15 | 10 | USD | Subscription |

**voice_sessions table**

| Column | Description |
|--------|-------------|
| channel_id | The ID of the voice channel |
| guild_id | The ID of the guild where the voice channel is located (if applicable) |
| duration_mins | The duration of the voice session (in minutes) |
| started_date | The start date and time of the voice session, in the format "YYYY-MM-DD HH:MM:SS" |
| ended_date | The end date and time of the voice session, in the format "YYYY-MM-DD HH:MM:SS" |

Example:
| channel_id | guild_id | duration_mins | started_date | ended_date |
|------------|----------|---------------|--------------|------------|
| 2345678901 | 3456789012 | 30 | 2022-06-15 10:00:00 | 2022-06-15 10:30:00 |Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


