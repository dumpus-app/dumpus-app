Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column               | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| event_name           | The type of event, in this case, "message_sent" for messages sent          |
| day                  | The date in the format YYYY-MM-DD                                          |
| hour                 | The hour of the day in the 24-hour format                                  |
| occurence_count      | The number of occurrences of the event during the specified hour of the day |
| associated_dm_user_id| The user ID associated with the DM channel                                  |
| associated_channel_id| The ID of the channel where the event occurred                              |
| associated_guild_id  | The ID of the guild (server) where the event occurred                      |


**dm_channels_data table**

| Column                      | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| channel_id                  | The ID of the direct message channel                             |
| dm_user_id                  | The user ID associated with the DM channel                        |
| user_name                   | The username of the user                                         |
| display_name                | The display name (nickname) of the user                           |
| user_avatar_url             | The URL of the user's avatar                                      |
| total_message_count         | The total number of messages sent in the DM channel               |
| total_voice_channel_duration| The total duration spent in voice channels                        |
| sentiment_score             | The sentiment score of messages sent in the DM channel            |


**guild_channels_data table**

| Column                      | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| channel_id                  | The ID of the guild channel                           |
| guild_id                    | The ID of the guild (server)                          |
| channel_name                | The name of the guild channel                         |
| total_message_count         | The total number of messages sent in the guild channel|
| total_voice_channel_duration| The total duration spent in voice channels            |


**guilds table**

| Column              | Description                                   |
| ------------------- | --------------------------------------------- |
| guild_id            | The ID of the guild (server)                  |
| guild_name          | The name of the guild                         |
| total_message_count | The total number of messages sent in the guild|


**payments table**

| Column             | Description                                            |
| ------------------ | ------------------------------------------------------ |
| payment_id         | The ID of the payment                                  |
| payment_date       | The date of the payment in the format YYYY-MM-DD       |
| payment_amount     | The amount of the payment                              |
| payment_currency   | The currency of the payment                            |
| payment_description| A description of the payment                           |


**voice_sessions table**

| Column       | Description                                           |
| ------------ | ----------------------------------------------------- |
| channel_id   | The ID of the voice channel                           |
| guild_id     | The ID of the guild (server)                          |
| duration_mins| The duration of the voice session in minutes          |
| started_date | The date when the voice session started (YYYY-MM-DD) |
| ended_date   | The date when the voice session ended (YYYY-MM-DD)   |