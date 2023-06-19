Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
| Column                | Description                                                                                                        |
|-----------------------|--------------------------------------------------------------------------------------------------------------------|
| event_name            | The type of activity/event such as 'message_sent' or 'guild_joined'                                                |
| day                   | The day when the activity happened, in the format 'YYYY-MM-DD'                                                      |
| hour                  | The hour of the day when the activity happened, as an integer (0-23)                                               |
| occurrence_count      | The number of occurrences of the activity during the specific day and hour                                         |
| associated_channel_id | The associated channel ID, if the activity is related to a channel (e.g., message_sent event)                      |
| associated_guild_id   | The associated guild ID, if the activity is related to a guild (e.g., guild_joined event)                          |

**dm_channels_data table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| channel_id                | The ID of the DM channel                                          |
| dm_user_id                | The ID of the user in the DM channel                              |
| user_name                 | The username of the user in the DM channel                        |
| display_name              | The display name of the user in the DM channel                    |
| user_avatar_url           | The URL of the user's avatar in the DM channel                    |
| total_message_count       | The total number of messages sent in the DM channel               |
| total_voice_channel_duration | The total duration of voice channel activity in the DM channel, in minutes |
| sentiment_score           | The sentiment score of the messages in the DM channel             |

**guild_channels_data table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| channel_id                | The ID of the guild channel                                       |
| guild_id                  | The ID of the guild the channel belongs to                        |
| channel_name              | The name of the guild channel                                     |
| total_message_count       | The total number of messages sent in the guild channel            |
| total_voice_channel_duration | The total duration of voice channel activity in the guild channel, in minutes |

**guilds table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| guild_id                  | The ID of the guild                                               |
| guild_name                | The name of the guild                                             |
| total_message_count       | The total number of messages sent across all channels in the guild|

**payments table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| payment_id                | The ID of the payment                                             |
| payment_date              | The date of the payment, in the format 'YYYY-MM-DD'               |
| payment_amount            | The amount of the payment                                         |
| payment_currency          | The currency of the payment                                       |
| payment_description       | The description of the payment                                    |

**voice_sessions table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| channel_id                | The ID of the channel the voice session took place in             |
| guild_id                  | The ID of the guild the voice session took place in               |
| duration_mins             | The duration of the voice session, in minutes                     |
| started_date              | The starting date and time of the voice session, in 'YYYY-MM-DD HH:MM:SS' format |
| ended_date                | The ending date and time of the voice session, in 'YYYY-MM-DD HH:MM:SS' format |

**package_data table**
| Column                    | Description                                                       |
|---------------------------|-------------------------------------------------------------------|
| package_id                | The ID of the data package                                        |
| package_version           | The version of the data package                                   |
| package_owner_name        | The username of the owner of the data package                     |
| package_owner_display_name | The display name of the owner of the data package                |
| package_owner_avatar_url  | The URL of the owner's avatar                                     |