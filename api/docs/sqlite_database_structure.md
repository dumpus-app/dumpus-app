Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

|Column|Description
|---|---|
|event_name|The kind of activity event. Examples of events include 'message_sent', 'guild_joined', 'application_command_used', etc.|
|day|The date when the event occurred, represented in 'YYYY-MM-DD' format.|
|hour|The hour when the event occurred (in 24-hour format).|
|occurence_count|The number of times the event occurred.|
|associated_channel_id|The channel ID associated with the event (if applicable).|
|associated_guild_id|The guild ID associated with the event (if applicable).|
|associated_user_id|The user ID associated with the event (if applicable).|
|extra_field_1|Extra data associated with the event, its use varies depending on the event type.|
|extra_field_2|Another field for extra data associated with the event, its use varies depending on the event type.|


**dm_channels_data table**

|Column|Description|
|---|---|
|channel_id|The unique identifier of the Direct Message (DM) channel.|
|dm_user_id|The unique identifier of the user in the DM channel.|
|user_name|The username of the user in the DM channel.|
|display_name|The display name of the user in the DM channel.|
|user_avatar_url|The URL of the user's avatar.|
|total_message_count|The total number of messages in the DM channel.|
|total_voice_channel_duration|The total duration of voice channel usage in the DM.|
|sentiment_score|The sentiment score associated with the DM channel.|


**guild_channels_data table**

|Column|Description|
|---|---|
|channel_id|The unique identifier of the guild channel.|
|guild_id|The unique identifier of the guild.|
|channel_name|The name of the channel.|
|total_message_count|The total number of messages in the guild channel.|
|total_voice_channel_duration|The total duration of voice channel usage in the guild.|


**guilds table**

|Column|Description|
|---|---|
|guild_id|The unique identifier of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages in the guild.|


**payments table**

|Column|Description|
|---|---|
|payment_id|The unique identifier of the payment.|
|payment_date|The date when the payment was made, represented in 'YYYY-MM-DD' format.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|A description of the payment.|


**voice_sessions table**

|Column|Description|
|---|---|
|channel_id|The unique identifier of the channel where the voice session took place.|
|guild_id|The unique identifier of the guild where the voice session took place.|
|duration_mins|The duration of the voice session in minutes.|
|started_date|The date and time when the voice session started.|
|ended_date|The date and time when the voice session ended.|


**sessions table**

|Column|Description|
|---|---|
|duration_mins|The duration of the session in minutes.|
|started_date|The date and time when the session started.|
|ended_date|The date and time when the session ended.|
|device_os|The operating system of the device used in the session.|


**package_data table**

|Column|Description|
|---|---|
|package_id|The unique identifier of the data package.|
|package_version|The version of the data package.|
|package_owner_id|The unique identifier of the owner of the data package.|
|package_owner_name|The name of the owner of the data package.|
|package_owner_display_name|The display name of the owner of the data package.|
|package_owner_avatar_url|The URL of the owner's avatar.|
|package_is_partial|A boolean value indicating whether the data package is partial (1) or complete (0).|