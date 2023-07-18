Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|------|-----------|
|event_name|The name of the event/activity conducted. e.g., "message_sent", "guild_joined", "application_command_used", "add_reaction", etc.|
|day|The date when the event/activity conducted (formatted as "Year-Month-Day").|
|hour|The hour when the event/activity conducted (24-hour format).|
|occurrence_count|The number of times the event/activity occurred.|
|associated_channel_id|The id of the channel associated with the event. Could be null for events not related to a specific channel.|
|associated_guild_id|The id of the guild associated with the event. Could be null for events not related to a specific guild.|
|associated_user_id|The id of the user associated with the event. Could be null for events not related to a user.|
|extra_field_1|Additional information related to the event (varies based on event_type).|
|extra_field_2|More additional information related to the event (varies based on event_type).|

**dm_channels_data table**
|Column|Description|
|------|-----------|
|channel_id|The unique id of the direct message (DM) channel.|
|dm_user_id|The id of the user in the DM channel.|
|user_name|The username of the user in the DM channel.|
|display_name|The display name of the user in the DM channel.|
|user_avatar_url|The URL of the user's avatar in the DM channel.|
|total_message_count|The total number of messages exchanged in the DM channel.|
|total_voice_channel_duration|The total duration spent in voice channels in this DM channel.|
|sentiment_score|The sentiment score of the messages exchanged in the DM channel.|

**guild_channels_data table**
|Column|Description|
|------|-----------|
|channel_id|The unique id of the guild channel.|
|guild_id|The id of the guild associated with the channel.|
|channel_name|The name of the guild channel.|
|total_message_count|The total number of messages exchanged in the guild channel.|
|total_voice_channel_duration|The total duration spent in voice channels in this guild channel.|

**guilds table**
|Column|Description|
|------|-----------|
|guild_id|The unique id of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages exchanged in the guild.|

**payments table**
|Column|Description|
|------|-----------|
|payment_id|The unique id of the payment transaction.|
|payment_date|The date when the payment was made (formatted as "Year-Month-Day").|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|The description of the payment.|

**voice_sessions table**
|Column|Description|
|------|-----------|
|channel_id|The unique id of the channel where the voice session took place.|
|guild_id|The id of the guild where the voice session took place.|
|duration_mins|The duration of the voice session in minutes.|
|started_date|The start date of the voice session.|
|ended_date|The end date of the voice session.|

**sessions table**
|Column|Description|
|------|-----------|
|duration_mins|The duration of the session in minutes.|
|started_date|The start date of the session.|
|ended_date|The end date of the session.|
|device_os|The operating system of the device used during the session.|