Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column                 | Description                                                                                              |
|------------------------|----------------------------------------------------------------------------------------------------------|
| event_name             | The name of the event, for example, "message_sent".                                                     |
| day                    | The date when the event occurred, in the format YYYY-MM-DD.                                             |
| hour                   | The hour when the event occurred (0-23).                                                                |
| occurence_count        | The number of times the event occurred during the specified hour.                                       |
| associated_dm_user_id  | The user ID associated with the event, if applicable (for Direct Messages only).                        |
| associated_channel_id  | The channel ID associated with the event.                                                               |
| associated_guild_id    | The guild ID associated with the event (for Guild channels only).                                      |

**dm_channels_data table**

| Column                     | Description                                                                                          |
|----------------------------|------------------------------------------------------------------------------------------------------|
| channel_id                 | The ID of the Direct Message channel.                                                               |
| dm_user_id                 | The user ID associated with the Direct Message channel.                                             |
| user_name                  | The username of the user associated with the Direct Message channel.                                 |
| user_avatar_url            | The avatar URL of the user associated with the Direct Message channel.                               |
| total_message_count        | The total number of messages in the Direct Message channel.                                         |
| total_voice_channel_duration | The total duration of voice channel sessions in the Direct Message channel (in minutes).            |
| sentiment_score            | The sentiment score of the messages in the Direct Message channel.                                  |

**guild_channels_data table**

| Column                     | Description                                                                                          |
|----------------------------|------------------------------------------------------------------------------------------------------|
| channel_id                 | The ID of the Guild channel.                                                                        |
| channel_name               | The name of the Guild channel.                                                                      |
| guild_id                   | The guild ID associated with the Guild channel.                                                      |
| total_message_count        | The total number of messages in the Guild channel.                                                  |
| total_voice_channel_duration | The total duration of voice channel sessions in the Guild channel (in minutes).                     |

**guilds table**

| Column                 | Description                                                                                              |
|------------------------|----------------------------------------------------------------------------------------------------------|
| guild_id               | The ID of the guild.                                                                                     |
| guild_name             | The name of the guild.                                                                                   |
| total_message_count    | The total number of messages across all channels in the guild.                                          |

**payments table**

| Column                 | Description                                                                                              |
|------------------------|----------------------------------------------------------------------------------------------------------|
| payment_id             | The unique ID of the payment.                                                                            |
| payment_date           | The date when the payment was made, in the format YYYY-MM-DD.                                           |
| payment_amount         | The amount of the payment (integer).                                                                     |
| payment_currency       | The currency used for the payment (for example, "USD").                                                  |
| payment_description    | A brief description of the payment.                                                                      |

**voice_sessions table**

| Column                 | Description                                                                                              |
|------------------------|----------------------------------------------------------------------------------------------------------|
| channel_id             | The ID of the channel associated with the voice session.                                                 |
| guild_id               | The guild ID associated with the voice session (if applicable).                                          |
| duration_mins          | The duration of the voice session in minutes.                                                            |
| started_date           | The start date of the voice session in the format YYYY-MM-DD.                                           |
| ended_date             | The end date of the voice session in the format YYYY-MM-DD.                                             |