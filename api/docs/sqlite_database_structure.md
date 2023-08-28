Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


The code is creating a SQLite database and filling it with information from various sources, including:

- Direct Messages (DMs) channels
- Guild channels
- Activity data (such as messages sent, guild joined, app opened, etc.)
- Guild data
- Payments data
- Voice session data, etc.

It's also performing various activities like grouping data per hour, inserting into different database tables, and updating necessary fields.

Below is the documentation for tables in SQLite database:

**activity table**

|Column|Description|
|---|---|
|event_name|This column stores the name of the event occurred, could be message_sent, guild_joined, app_opened etc.|
|day|This column stores the date in format 'Y-m-d' (like 2021-12-31) when the event occurred|
|hour|This column stores hour of the day ranging from 0-23 when the event occurred |
|occurence_count|This column stores the count of the events occurred|
|associated_channel_id|This column stores the id of the channel associated with that event|
|associated_guild_id|This column stores the id of the guild associated with that event|
|associated_user_id|This column stores the id of the user associated with that event|
|extra_field_1|This column stores extra information related to the specific event. It can be various things depending on the event type|
|extra_field_2|Another column for storing extra information related to the specific event, the information changes depending on the event type|

**dm_channels_data table**

|Column|Description|
|---|---|
|channel_id|This column stores the id of the channel|
|dm_user_id|This column stores the id of the user who is in direct message with current user|
|user_name|This column stores the discord username of the user|
|display_name|This column stores the display name of the user, if available|
|user_avatar_url|This column stores the avatar URL of the user, if available|
|total_message_count|This column stores the total count of the messages in the DM|
|total_voice_channel_duration|This column stores the total duration (in minutes) spent by the user in voice channels|
|sentiment_score|This column stores the sentiment score of the messages, this is a numerical score to quantify the sentiment analysis outcome|

**guild_channels_data table**

|Column|Description|
|---|---|
|channel_id|This column stores the id of the guild channel|
|guild_id|This column stores the id of the guild|
|channel_name|This column stores the name of the channel within the guild|
|total_message_count|This column stores the total count messages sent within the guild channel|
|total_voice_channel_duration|This column stores the total duration (in minutes) spent by the users in the voice channels of the guild|

**guilds table**

|Column|Description|
|---|---|
|guild_id|This column stores the id of the guild|
|guild_name|This column stores the name of the guild|
|total_message_count|This column stores the total count messages sent within the guild|

The remaining tables follow similar structure according to the data they are storing. For example, 'payments' table will have columns related to payment information (id, date, amount, currency, description), 'voice_sessions' table will store voice session data (channel_id, guild_id, duration_mins, started_date, ended_date), etc. Each table is storing a specific type of data regarding user's interactions and activities in Discord.