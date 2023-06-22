Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
| Column                | Description |
|-----------------------|-------------|
| event_name            | The type of event/activity occurring, such as 'message_sent' or 'guild_joined'. |
| day                   | The day when the event/activity occurred, formatted as 'YYYY-MM-DD'. |
| hour                  | The hour when the event/activity occurred, as an integer (0-23). |
| occurence_count       | The number of times the event/activity occurred during the specified hour. |
| associated_channel_id | The ID of the channel associated with the event/activity, if applicable. |
| associated_guild_id   | The ID of the guild associated with the event/activity, if applicable. |

**dm_channels_data table**
| Column                   | Description |
|--------------------------|-------------|
| channel_id               | The ID of the direct message (DM) channel. |
| dm_user_id               | The ID of the user involved in the DM channel. |
| user_name                | The username of the user involved in the DM channel. |
| display_name             | The display name of the user involved in the DM channel. |
| user_avatar_url          | The URL of the user's avatar image. |
| total_message_count      | The total number of messages in the DM channel. |
| total_voice_channel_duration | The total duration of voice channel usage in minutes, if applicable. |
| sentiment_score          | The sentiment score associated with the DM channel, calculated based on the content of messages. |

**guild_channels_data table**
| Column                       | Description |
|------------------------------|-------------|
| channel_id                   | The ID of the guild channel. |
| guild_id                     | The ID of the guild associated with the channel. |
| channel_name                 | The name of the guild channel. |
| total_message_count          | The total number of messages in the guild channel. |
| total_voice_channel_duration | The total duration of voice channel usage in minutes, if applicable. |

**guilds table**
| Column              | Description |
|---------------------|-------------|
| guild_id            | The ID of the guild. |
| guild_name          | The name of the guild. |
| total_message_count | The total number of messages in the guild. |

**payments table**
| Column              | Description |
|---------------------|-------------|
| payment_id          | The ID of the payment. |
| payment_date        | The date when the payment was made, formatted as 'YYYY-MM-DD'. |
| payment_amount      | The amount of the payment. |
| payment_currency    | The currency of the payment (e.g., 'USD'). |
| payment_description | A description of the payment. |

**voice_sessions table**
| Column        | Description |
|---------------|-------------|
| channel_id    | The ID of the voice channel. |
| guild_id      | The ID of the guild associated with the voice channel. |
| duration_mins | The duration of the voice session in minutes. |
| started_date  | The start date and time of the session, formatted as 'YYYY-MM-DD HH:MM:SS'. |
| ended_date    | The end date and time of the session, formatted as 'YYYY-MM-DD HH:MM:SS'. |

**package_data table**
| Column                   | Description |
|--------------------------|-------------|
| package_id               | The ID of the package. |
| package_version          | The version number of the package (e.g., '0.1.0'). |
| package_owner_name       | The username of the package owner. |
| package_owner_display_name | The display name of the package owner. |
| package_owner_avatar_url | The URL of the package owner's avatar image. |