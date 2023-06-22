Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
| Column | Description |
|---|---|
| event_name | Type of event occurring in this record, e.g. 'message_sent' or 'guild_joined'. |
| day | Date of the event in format 'YYYY-MM-DD'. |
| hour | Hour of the day when the event occurred (0-23). |
| occurence_count | Number of occurrences of the event within the given hour. |
| associated_channel_id | The ID of the channel associated with the event, if applicable. |
| associated_guild_id | The ID of the guild associated with the event, if applicable. |

**dm_channels_data table**
| Column | Description |
|---|---|
| channel_id | Unique identifier for the direct message channel. |
| dm_user_id | Unique identifier for the user in the direct message channel. |
| user_name | User's name in the direct message channel. |
| display_name | User's display name in the direct message channel. |
| user_avatar_url | URL of the user's avatar in the direct message channel. |
| total_message_count | Total number of messages sent in the direct message channel. |
| total_voice_channel_duration | Total duration of voice channel usage in minutes, if applicable. |
| sentiment_score | Sentiment score of the messages in the direct message channel. |

**guild_channels_data table**
| Column | Description |
|---|---|
| channel_id | Unique identifier for the guild channel. |
| guild_id | Unique identifier for the guild associated with the channel. |
| channel_name | Name of the guild channel. |
| total_message_count | Total number of messages sent in the guild channel. |
| total_voice_channel_duration | Total duration of voice channel usage in minutes, if applicable. |

**guilds table**
| Column | Description |
|---|---|
| guild_id | Unique identifier for the guild. |
| guild_name | Name of the guild. |
| total_message_count | Total number of messages sent in the guild. |

**payments table**
| Column | Description |
|---|---|
| payment_id | Unique identifier for the payment. |
| payment_date | Date of the payment in format 'YYYY-MM-DD'. |
| payment_amount | Amount of the payment. |
| payment_currency | Currency of the payment. |
| payment_description | Description of the payment. |

**voice_sessions table**
| Column | Description |
|---|---|
| channel_id | Unique identifier for the voice channel. |
| guild_id | Unique identifier for the guild associated with the voice channel. |
| duration_mins | Duration of the voice session in minutes. |
| started_date | Start date and time of the voice session in format 'YYYY-MM-DD HH:MM:SS'. |
| ended_date | End date and time of the voice session in format 'YYYY-MM-DD HH:MM:SS'. |

**package_data table**
| Column | Description |
|---|---|
| package_id | Unique identifier for the package. |
| package_version | Version of the package. |
| package_owner_id | Unique identifier for the owner of the package. |
| package_owner_name | Username of the package owner. |
| package_owner_display_name | Display name of the package owner. |
| package_owner_avatar_url | URL of the package owner's avatar. |