Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

|Column|Description|
|------|-----------|
|event_name|The type of event activity, such as 'message_sent', 'guild_joined', or 'application_command_used'|
|day|The date (YYYY-MM-DD format) when the event occurred|
|hour|The hour (integer format) when the event occurred|
|occurence_count|The number of events happened during the specified hour|
|associated_channel_id|The ID of the associated channel (if applicable)|
|associated_guild_id|The ID of the associated guild (if applicable)|
|associated_user_id|The ID of the associated user (if applicable)|

**dm_channels_data table**

|Column|Description|
|------|-----------|
|channel_id|The ID of the Direct Message (DM) channel|
|dm_user_id|The ID of the user involved in the DM|
|user_name|The username of the user involved in the DM|
|display_name|The display name of the user involved in the DM|
|user_avatar_url|The avatar URL of the user involved in the DM|
|total_message_count|The total number of messages in the DM channel|
|total_voice_channel_duration|The duration (in minutes) spent by the user in voice channels|
|sentiment_score|The sentiment score of the messages in the DM channel|

**guild_channels_data table**

|Column|Description|
|------|-----------|
|channel_id|The ID of the guild channel|
|guild_id|The ID of the associated guild|
|channel_name|The name of the guild channel|
|total_message_count|The total number of messages in the guild channel|
|total_voice_channel_duration|The total duration (in minutes) spent by users in the voice channel|

**guilds table**

|Column|Description|
|------|-----------|
|guild_id|The ID of the guild|
|guild_name|The name of the guild|
|total_message_count|The total number of messages in the guild|

**payments table**

|Column|Description|
|------|-----------|
|payment_id|The ID of the payment|
|payment_date|The date (YYYY-MM-DD format) of the payment|
|payment_amount|The amount of the payment|
|payment_currency|The currency of the payment|
|payment_description|The description of the payment|

**voice_sessions table**

|Column|Description|
|------|-----------|
|channel_id|The ID of the voice channel|
|guild_id|The ID of the associated guild|
|duration_mins|The duration (in minutes) of the voice session|
|started_date|The start date and time (datetime format) of the voice session|
|ended_date|The end date and time (datetime format) of the voice session|

**package_data table**

|Column|Description|
|------|-----------|
|package_id|The ID of the package|
|package_version|The version of the package|
|package_owner_id|The ID of the package owner|
|package_owner_name|The username of the package owner|
|package_owner_display_name|The display name of the package owner|
|package_owner_avatar_url|The avatar URL of the package owner|