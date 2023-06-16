Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column               | Description                                                                                             |
|----------------------|---------------------------------------------------------------------------------------------------------|
| event_name           | The name of the event associated with the activity, e.g., "message_sent".                                |
| day                  | The day when the event occurred, formatted as "YYYY-MM-DD".                                              |
| hour                 | The hour of the day when the event occurred (integer, 0-23).                                             |
| occurence_count      | The number of times the event occurred during the specified day and hour.                                |
| associated_dm_user_id| The user ID associated with the event if it occurred in a DM channel; otherwise, NULL.                  |
| associated_channel_id| The ID of the channel where the event occurred.                                                          |
| associated_guild_id  | The ID of the guild where the event occurred if it occurred in a guild channel; otherwise, NULL.        |

**dm_channels_data table**

| Column                     | Description                                                                                        |
|----------------------------|----------------------------------------------------------------------------------------------------|
| channel_id                 | The ID of the DM channel.                                                                          |
| dm_user_id                 | The user ID of the DM user.                                                                        |
| user_name                  | The username of the DM user.                                                                       |
| is_new_username            | Boolean flag indicating if the user has a new username (1 for true, 0 for false).                  |
| user_avatar_url            | The URL of the user's avatar.                                                                     |
| total_message_count        | The total number of messages sent in the DM channel.                                              |
| total_voice_channel_duration| The total duration (minutes) the user has spent in voice channels.                                |
| sentiment_score            | The sentiment score associated with the user's messages in the DM channel.                        |

**guild_channels_data table**

| Column                     | Description                                                                                        |
|----------------------------|----------------------------------------------------------------------------------------------------|
| channel_id                 | The ID of the guild channel.                                                                      |
| guild_id                   | The ID of the guild associated with the channel.                                                  |
| channel_name               | The name of the guild channel.                                                                    |
| total_message_count        | The total number of messages sent in the guild channel.                                           |
| total_voice_channel_duration| The total duration (minutes) of voice sessions in the guild channel.                              |

**guilds table**

| Column              | Description                                            |
|---------------------|--------------------------------------------------------|
| guild_id            | The ID of the guild.                                   |
| guild_name          | The name of the guild.                                 |
| total_message_count | The total number of messages sent across all channels in the guild.|

**payments table**

| Column             | Description                                                                                        |
|--------------------|----------------------------------------------------------------------------------------------------|
| payment_id         | The ID of the payment.                                                                            |
| payment_date       | The date of the payment, formatted as "YYYY-MM-DD".                                                |
| payment_amount     | The amount of the payment.                                                                        |
| payment_currency   | The currency of the payment (e.g., "USD").                                                        |
| payment_description| The description of the payment.                                                                   |

**voice_sessions table**

| Column         | Description                                                                                        |
|----------------|----------------------------------------------------------------------------------------------------|
| channel_id     | The ID of the channel where the voice session occurred.                                            |
| guild_id       | The ID of the guild where the voice session occurred.                                              |
| duration_mins  | The duration of the voice session in minutes.                                                      |
| started_date   | The date and time when the voice session started, formatted as "YYYY-MM-DD HH:MM:SS".              |
| ended_date     | The date and time when the voice session ended, formatted as "YYYY-MM-DD HH:MM:SS".                |