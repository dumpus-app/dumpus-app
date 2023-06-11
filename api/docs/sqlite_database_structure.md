Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| event_name            | Name of the event, e.g. 'message_sent'.                                                                                               |
| day                   | Date of the event in the format 'YYYY-MM-DD'.                                                                                         |
| hour                  | Hour of the event as an integer (0-23).                                                                                               |
| occurence_count       | Number of occurrences of the event within the given hour.                                                                             |
| associated_dm_user_id | User ID of the user associated with the event in Direct Messages, if applicable.                                                      |
| associated_channel_id | Channel ID of the channel associated with the event.                                                                                  |
| associated_guild_id   | Guild ID of the guild associated with the event, if applicable.                                                                      |

**dm_channels_data table**

| Column                      | Description                                                                                        |
|-----------------------------|----------------------------------------------------------------------------------------------------|
| channel_id                  | Channel ID of the Direct Message channel.                                                          |
| dm_user_id                  | User ID of the user associated with the Direct Message channel.                                   |
| user_name                   | Name of the user associated with the Direct Message channel.                                      |
| user_avatar_url             | URL of the user's avatar, if available.                                                           |
| total_message_count         | Total number of messages exchanged in the Direct Message channel.                                 |
| total_voice_channel_duration| Total duration of voice channels in minutes, in the Direct Message channel.                       |
| sentiment_score             | Sentiment score of the messages exchanged in the Direct Message channel.                          |

**guild_channels_data table**

| Column                      | Description                                                                               |
|-----------------------------|-------------------------------------------------------------------------------------------|
| channel_id                  | Channel ID of the Guild channel.                                                          |
| guild_id                    | Guild ID of the guild associated with the Guild channel.                                  |
| channel_name                | Name of the Guild channel.                                                                |
| total_message_count         | Total number of messages exchanged in the Guild channel.                                  |
| total_voice_channel_duration| Total duration of voice channels in minutes, in the Guild channel.                        |

**guilds table**

| Column              | Description                                    |
|---------------------|------------------------------------------------|
| guild_id            | Guild ID of the guild.                         |
| guild_name          | Name of the guild.                             |
| total_message_count | Total number of messages exchanged in the guild.|

**payments table**

| Column               | Description                                          |
|----------------------|------------------------------------------------------|
| payment_id           | Identifier for the payment.                          |
| payment_date         | Date of the payment in the format 'YYYY-MM-DD'.      |
| payment_amount       | Amount of the payment.                               |
| payment_currency     | Currency of the payment.                             |
| payment_description  | Description of the payment.                          |

**voice_sessions table**

| Column        | Description                                              |
|---------------|----------------------------------------------------------|
| channel_id    | Channel ID of the voice session.                         |
| guild_id      | Guild ID of the guild associated with the voice session. |
| duration_mins | Duration of the voice session in minutes.                |
| started_date  | Date and time when the voice session started.            |
| ended_date    | Date and time when the voice session ended.              |