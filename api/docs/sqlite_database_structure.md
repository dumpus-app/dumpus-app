**activity table**

| Column                 | Description                                                                                                                                                  |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| event_name             | Type of event that occurred, such as "message_sent"                                                                                                         |
| day                    | Day the event occurred in the format "YYYY-MM-DD"                                                                                                            |
| hour                   | Hour the event occurred                                                                                                                                      |
| occurence_count        | The number of occurrences of this event in the specified day and hour                                                                                        |
| associated_dm_user_id  | Identifier of the user involved in the event (for Direct Message channels)                                                                                   |
| associated_channel_id  | Identifier of the channel where the event occurred (for both Direct Message and Guild channels)                                                             |
| associated_guild_id    | Identifier of the guild where the event occurred (for Guild channels)                                                                                        |

**dm_channels_data table**

| Column                    | Description                                                                                                        |
|---------------------------|--------------------------------------------------------------------------------------------------------------------|
| channel_id                | Identifier of the Direct Message channel                                                                           |
| dm_user_id                | Identifier of the user involved in the Direct Message channel                                                      |
| user_name                 | Name of the user involved in the Direct Message channel                                                            |
| user_avatar_url           | URL of the user's avatar (profile picture)                                                                         |
| total_message_count       | Total number of messages sent in the Direct Message channel                                                        |
| total_voice_channel_duration | Total duration of voice channel usage in minutes within the Direct Message channel (currently always 0)          |
| sentiment_score           | Sentiment score of messages sent in the Direct Message channel                                                     |

**guild_channels_data table**

| Column                    | Description                                                                                                        |
|---------------------------|--------------------------------------------------------------------------------------------------------------------|
| channel_id                | Identifier of the Guild channel                                                                                    |
| guild_id                  | Identifier of the guild where the channel is located                                                               |
| channel_name              | Name of the Guild channel                                                                                          |
| total_message_count       | Total number of messages sent in the Guild channel                                                                 |
| total_voice_channel_duration | Total duration of voice channel usage in minutes within the Guild channel                                        |

**guilds table**

| Column               | Description                                                             |
|----------------------|-------------------------------------------------------------------------|
| guild_id             | Identifier of the guild                                                 |
| guild_name           | Name of the guild                                                       |
| total_message_count  | Total number of messages sent within all channels in the guild          |

**payments table**

| Column              | Description                                                                |
|---------------------|----------------------------------------------------------------------------|
| payment_id          | Identifier of the payment transaction                                      |
| payment_date        | Date of the payment in the format "YYYY-MM-DD"                             |
| payment_amount      | Amount of the payment                                                      |
| payment_currency    | Currency code of the payment (e.g., "USD")                                 |
| payment_description | Description of the payment transaction                                     |

**voice_sessions table**

| Column       | Description                                                         |
|--------------|---------------------------------------------------------------------|
| channel_id   | Identifier of the channel where the voice session occurred          |
| guild_id     | Identifier of the guild where the voice session occurred (for Guild channels)   |
| duration_mins| Duration of the voice session in minutes                            |
| started_date | Date and time the voice session started in the format "YYYY-MM-DD" |
| ended_date   | Date and time the voice session ended in the format "YYYY-MM-DD"   |Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


