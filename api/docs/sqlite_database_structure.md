Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column                | Description |
|-----------------------|-------------|
| event_name            | The name of the event that occurred, e.g., 'message_sent' |
| day                   | The day when the event happened in the format 'YYYY-MM-DD' |
| hour                  | The hour when the event happened (0-23) |
| occurence_count       | The number of times the event occurred during the specified hour |
| associated_dm_user_id | The ID of the user associated with the event in a direct message channel (nullable) |
| associated_channel_id | The ID of the channel where the event happened |
| associated_guild_id   | The ID of the guild where the event occurred (nullable) |

**dm_channels_data table**

| Column                      | Description |
|------------------------------|-------------|
| channel_id                   | The ID of the direct message channel |
| dm_user_id                   | The ID of the user in the direct message channel |
| user_name                    | The user name of the user in the direct message channel |
| display_name                 | The display name of the user in the direct message channel (nullable) |
| user_avatar_url              | The URL of the user's avatar image (nullable) |
| total_message_count          | The total number of messages in the direct message channel |
| total_voice_channel_duration | The total duration spent in voice channels (always 0 for direct messages) |
| sentiment_score              | The sentiment score of the messages in the direct message channel |

**guild_channels_data table**

| Column                      | Description |
|------------------------------|-------------|
| channel_id                   | The ID of the guild channel |
| guild_id                     | The ID of the guild the channel belongs to |
| channel_name                 | The name of the guild channel |
| total_message_count          | The total number of messages in the guild channel |
| total_voice_channel_duration | The total duration spent in the voice channel |

**guilds table**

| Column              | Description |
|---------------------|-------------|
| guild_id            | The ID of the guild |
| guild_name          | The name of the guild |
| total_message_count | The total number of messages in the guild |

**payments table**

| Column              | Description |
|---------------------|-------------|
| payment_id          | The ID of the payment |
| payment_date        | The date of the payment in the format 'YYYY-MM-DD' |
| payment_amount      | The amount of the payment |
| payment_currency    | The currency of the payment |
| payment_description | The description of the payment |

**voice_sessions table**

| Column       | Description |
|--------------|-------------|
| channel_id   | The ID of the voice channel |
| guild_id     | The ID of the guild the channel belongs to (nullable) |
| duration_mins| The duration of the voice session in minutes |
| started_date | The start date and time of the voice session in the format 'YYYY-MM-DD HH:MM:SS' |
| ended_date   | The end date and time of the voice session in the format 'YYYY-MM-DD HH:MM:SS' |

**package_data table**

| Column                    | Description |
|---------------------------|-------------|
| package_id                | The ID of the package |
| package_version           | The version of the package |
| package_owner_name        | The user name of the package owner |
| package_owner_display_name| The display name of the package owner (nullable) |
| package_owner_avatar_url  | The URL of the package owner's avatar image (nullable) |