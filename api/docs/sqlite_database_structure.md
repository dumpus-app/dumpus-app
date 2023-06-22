Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column                | Description                                                                                                   |
|-----------------------|---------------------------------------------------------------------------------------------------------------|
| event_name            | The type of event associated with an activity, such as "message_sent" or "guild_joined".                     |
| day                   | The day of the event in the format 'YYYY-MM-DD'.                                                              |
| hour                  | The hour of the day when the event occurred (0-23).                                                           |
| occurence_count       | The number of occurrences of the event within the given hour.                                                 |
| associated_channel_id | The ID of the channel associated with the event, if applicable.                                               |
| associated_guild_id   | The ID of the guild associated with the event, if applicable.                                                 |

**dm_channels_data table**

| Column                   | Description                                                                                                   |
|--------------------------|---------------------------------------------------------------------------------------------------------------|
| channel_id               | The ID of the DM (Direct Message) channel.                                                                   |
| dm_user_id               | The ID of the user participating in the DM.                                                                   |
| user_name                | The username of the user participating in the DM.                                                             |
| display_name             | The display name of the user participating in the DM.                                                         |
| user_avatar_url          | The URL of the user's avatar participating in the DM.                                                         |
| total_message_count      | The total number of messages sent in the DM channel.                                                          |
| total_voice_channel_duration | The total duration spent in voice channels associated with the DM, in minutes.                            |
| sentiment_score          | The sentiment score of the messages in the DM channel.                                                        |

**guild_channels_data table**

| Column                   | Description                                                                                                   |
|--------------------------|---------------------------------------------------------------------------------------------------------------|
| channel_id               | The ID of the guild channel.                                                                                  |
| guild_id                 | The ID of the guild.                                                                                          |
| channel_name             | The name of the guild channel.                                                                                |
| total_message_count      | The total number of messages sent in the guild channel.                                                       |
| total_voice_channel_duration | The total duration spent in voice channels associated with the guild channel, in minutes.                 |

**guilds table**

| Column                | Description                                                                                                   |
|-----------------------|---------------------------------------------------------------------------------------------------------------|
| guild_id              | The ID of the guild.                                                                                          |
| guild_name            | The name of the guild.                                                                                        |
| total_message_count   | The total number of messages sent in the guild.                                                               |

**payments table**

| Column                | Description                                                                                                   |
|-----------------------|---------------------------------------------------------------------------------------------------------------|
| payment_id            | The ID of the payment.                                                                                        |
| payment_date          | The date of the payment in the format 'YYYY-MM-DD'.                                                           |
| payment_amount        | The amount of the payment.                                                                                    |
| payment_currency      | The currency of the payment (e.g. "USD").                                                                    |
| payment_description   | The description of the payment.                                                                               |

**voice_sessions table**

| Column                | Description                                                                                                   |
|-----------------------|---------------------------------------------------------------------------------------------------------------|
| channel_id            | The ID of the channel associated with the voice session.                                                      |
| guild_id              | The ID of the guild associated with the voice session.                                                        |
| duration_mins         | The duration of the voice session in minutes.                                                                 |
| started_date          | The date and time when the voice session started in the format 'YYYY-MM-DD HH:mm:ss'.                         |
| ended_date            | The date and time when the voice session ended in the format 'YYYY-MM-DD HH:mm:ss'.                           |

**package_data table**

| Column                  | Description                                                                                                   |
|-------------------------|---------------------------------------------------------------------------------------------------------------|
| package_id              | The ID of the package.                                                                                        |
| package_version         | The version of the package (e.g. "0.1.0").                                                                   |
| package_owner_id        | The ID of the user who owns the package.                                                                     |
| package_owner_name      | The username of the user who owns the package.                                                               |
| package_owner_display_name | The display name of the user who owns the package.                                                         |
| package_owner_avatar_url | The URL of the user's avatar who owns the package.                                                          |