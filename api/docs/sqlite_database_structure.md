Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column                | Description                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------|
| event_name            | Event type, such as "message_sent"; represents the activities within channels.                              |
| day                   | The date (YYYY-MM-DD format) when the event occurred.                                                       |
| hour                  | The hour (0-23) when the event occurred.                                                                    |
| occurence_count       | The number of occurrences of the event within the specified hour.                                           |
| associated_dm_user_id | The user ID associated with direct message (DM) channels, if applicable.                                    |
| associated_channel_id | The ID of the channel where the event occurred.                                                             |
| associated_guild_id   | The ID of the guild (server) where the event occurred, if applicable.                                       |

**dm_channels_data table**

| Column                      | Description                                                             |
|-----------------------------|-------------------------------------------------------------------------|
| channel_id                  | The ID of the direct message (DM) channel.                             |
| dm_user_id                  | The ID of the user associated with the DM channel.                      |
| user_name                   | The name of the user associated with the DM channel.                    |
| user_avatar_url             | The URL of the user's avatar associated with the DM channel.            |
| total_message_count         | The total number of messages sent in the DM channel.                    |
| total_voice_channel_duration| The total duration (in minutes) of voice channel sessions.              |
| sentiment_score             | Sentiment score of messages in the DM channel.                          |

**guild_channels_data table**

| Column                      | Description                                                                                           |
|-----------------------------|-------------------------------------------------------------------------------------------------------|
| channel_id                  | The ID of the guild (server) channel.                                                                |
| guild_id                    | The ID of the guild (server) that the channel belongs to.                                            |
| channel_name                | The name of the guild channel.                                                                       |
| total_message_count         | The total number of messages sent in the guild channel.                                               |
| total_voice_channel_duration| The total duration (in minutes) of voice channel sessions within the guild channel.                   |

**guilds table**

| Column              | Description                                                   |
|---------------------|---------------------------------------------------------------|
| guild_id            | The ID of the guild (server).                                 |
| guild_name          | The name of the guild.                                        |
| total_message_count | The total number of messages sent across all guild channels.  |

**payments table**

| Column              | Description                                                   |
|---------------------|---------------------------------------------------------------|
| payment_id          | The unique ID of the payment.                                 |
| payment_date        | The date (YYYY-MM-DD format) when the payment was made.       |
| payment_amount      | The amount of the payment.                                    |
| payment_currency    | The currency of the payment.                                  |
| payment_description | A description of the payment.                                 |

**voice_sessions table**

| Column        | Description                                                   |
|---------------|---------------------------------------------------------------|
| channel_id    | The ID of the channel where the voice session occurred.       |
| guild_id      | The ID of the guild (server) where the voice session occurred, if applicable. |
| duration_mins | The duration (in minutes) of the voice session.               |
| started_date  | The date (YYYY-MM-DD format) when the voice session started.  |
| ended_date    | The date (YYYY-MM-DD format) when the voice session ended.    |