Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
| Column               | Description                                               |
|----------------------|-----------------------------------------------------------|
| event_name           | Name of the event, e.g., "message_sent"                   |
| day                  | Date in the format 'YYYY-MM-DD'                           |
| hour                 | Hour of the day as an integer between 0 and 23            |
| occurence_count      | Number of occurrences of the event in that hour and day   |
| associated_dm_user_id | Associated user ID if the event was in a direct message channel |
| associated_channel_id | ID of the channel where the event occurred               |
| associated_guild_id  | ID of the guild where the event occurred                 |

**dm_channels_data table**
| Column                    | Description                                         |
|---------------------------|-----------------------------------------------------|
| channel_id                | ID of the direct message channel                    |
| dm_user_id                | ID of the user involved in the direct message channel |
| user_name                 | Name of the user involved in the direct message channel |
| user_avatar_url           | URL of the user's avatar                            |
| total_message_count       | Total message count that occurred in the channel    |
| total_voice_channel_duration | Total duration of voice channel sessions in minutes |
| sentiment_score           | The sentiment score of messages in the channel      |

**guild_channels_data table**
| Column                    | Description                            |
|---------------------------|----------------------------------------|
| channel_id                | ID of the guild channel                |
| guild_id                  | ID of the guild                        |
| channel_name              | Name of the guild channel              |
| total_message_count       | Total message count in the channel     |
| total_voice_channel_duration | Total duration of voice channel sessions in minutes |

**guilds table**
| Column              | Description                                   |
|---------------------|-----------------------------------------------|
| guild_id            | ID of the guild                               |
| guild_name          | Name of the guild                             |
| total_message_count | Total message count across all guild channels |

**payments table**
| Column             | Description                                          |
|--------------------|------------------------------------------------------|
| payment_id         | ID of the payment                                    |
| payment_date       | Date of payment in the format 'YYYY-MM-DD'           |
| payment_amount     | Amount of the payment                                |
| payment_currency   | Currency of the payment                               |
| payment_description | Description of the payment                          |

**voice_sessions table**
| Column           | Description                                       |
|------------------|---------------------------------------------------|
| channel_id       | ID of the channel where the voice session occurred |
| guild_id         | ID of the guild                                   |
| duration_mins    | Duration of the voice session in minutes          |
| started_date     | Date when the voice session started               |
| ended_date       | Date when the voice session ended                 |