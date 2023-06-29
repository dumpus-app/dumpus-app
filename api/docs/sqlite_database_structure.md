Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|---|---|
|event_name|This field represents the type of the event. It could be one of the following: message_sent, guild_joined, application_command_used, add_reaction, or app_opened.|
|day|The day the event took place, formatted as 'YYYY-MM-DD'.|
|hour|The hour of the day when the event took place, in 24-hour format.|
|occurence_count|Number of times the specific event happened.|
|associated_channel_id|The ID of the channel where the event occurred. This will be `None` if the event does not relate to any specific channel.|
|associated_guild_id|The ID of the guild where the event occurred. This will be `None` if the event does not relate to any specific guild.|
|associated_user_id|The ID of the user involved in the event. This will be `None` if the event does not relate to any specific user.|
|extra_field_1|Additional data about the event. The type and meaning of the data will depend on the event_name.|
|extra_field_2|Additional data about the event. The type and meaning of the data will depend on the event_name.|

**dm_channels_data table**
|Column|Description|
|---|---|
|channel_id|Unique identifier for each direct message (DM) channel.|
|dm_user_id|User ID for the person involved in the DM.|
|user_name|The username of the person involved in the DM.|
|display_name|The display name of the person involved in the DM.|
|user_avatar_url|The URL linking to the avatar of the user involved in the DM.|
|total_message_count|The total number of messages exchanged in this DM.|
|total_voice_channel_duration|The total duration of voice activity in this channel.|
|sentiment_score|A score representing the overall sentiment in the direct channel. Higher scores indicate positive sentiment, while lower scores indicate negative sentiment.|

**guild_channels_data table**
|Column|Description|
|---|---|
|channel_id|ID of the guild channel.|
|guild_id|ID of the guild where the channel exists.|
|channel_name|The name of the guild channel.|
|total_message_count|The total number of messages sent in the guild channel.|
|total_voice_channel_duration|The total duration of voice chat in the guild channel.|

**guilds table**
|Column|Description|
|---|---|
|guild_id|Unique identifier for each guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages exchanged in the guild.|

**payments table**
|Column|Description|
|---|---|
|payment_id|Unique identifier for each payment.|
|payment_date|The date the payment was made, formatted as 'YYYY-MM-DD'.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|Text describing what the payment was for.|

**voice_sessions table**
|Column|Description|
|---|---|
|channel_id|The ID of the channel where the voice chat took place.|
|guild_id|The ID of the guild the voice chat belonged to.|
|duration_mins|The duration of the voice chat, in minutes.|
|started_date|The date and time the voice chat started, presented as 'YYYY-MM-DD HH:MM:SS'.|
|ended_date|The date and time the voice chat ended, presented as 'YYYY-MM-DD HH:MM:SS'.|

**sessions table**
|Column|Description|
|---|---|
|started_date|The date and time the session started, formatted as 'YYYY-MM-DD HH:MM:SS'.|
|ended_date|The date and time the session ended, formatted as 'YYYY-MM-DD HH:MM:SS'.|
|duration_mins|The duration of the session, in minutes.|
|device_os|The operating system of the device used for the session.|