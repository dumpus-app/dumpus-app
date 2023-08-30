Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

|Column|Description|
|---|---|
|event_name|Identification of activity event. This may include 'message_sent', 'guild_joined', 'application_command_used', etc. |
|day|The day the described event occurred, format is 'YYYY-MM-DD'. |
|hour|The hour the event occurred, expressed in a 24-hour format.|
|occurence_count|How many times the event has occurred.|
|associated_channel_id|The unique ID of the channel associated with the event.|
|associated_guild_id|The Unique ID of the guild (server) associated with the event.|
|associated_user_id|The unique user ID associated with the event.|
|extra_field_1|Additional details about the event. The values vary depending on the given event.|
|extra_field_2|Additional details about the event. The values vary depending on the given event.|

**dm_channels_data table**

|Column|Description|
|---|---|
|channel_id|Unique ID of the channel where direct message happened.|
|dm_user_id|Unique ID of the user involved in the direct message.|
|user_name|Username of the user involved in the direct message.|
|display_name|Display name of the user involved in the direct message.|
|user_avatar_url|URL of the user's avatar.|
|total_message_count|Total count of messages in the direct message.|
|total_voice_channel_duration|Total duration of voice channel usage in minutes.|
|sentiment_score|Sentiment score of messages in the direct message (ranges from -1 to 1, from negative to positive sentiment).|

**guild_channels_data table**

|Column|Description|
|---|---|
|channel_id|Unique ID of the guild channel.|
|guild_id|Unique ID of the guild (server).|
|channel_name|Name of the guild channel.|
|total_message_count|Total count of messages in the guild channel.|
|total_voice_channel_duration|Total duration of voice channel usage in the guild channel in minutes.|

**guilds table**

|Column|Description|
|---|---|
|guild_id|Unique ID of the guild.|
|guild_name|Name of the guild.|
|total_message_count|Total count of messages in the guild.|

**payments table**

|Column|Description|
|---|---|
|payment_id|Unique ID of the payment transaction.|
|payment_date|Date of the payment done, format is 'YYYY-MM-DD'.|
|payment_amount|Amount of payment done.|
|payment_currency|Currency of the payment done.|
|payment_description|Description of the payment done.|

**voice_sessions table**

|Column|Description|
|---|---|
|channel_id|Unique ID of the channel where voice session was held.|
|guild_id|Unique ID of the guild (server), of which channel the voice session was held.|
|duration_mins|Duration of the voice session in minutes.|
|started_date|Start date and time of the voice session.|
|ended_date|End date and time of the voice session.|

**sessions table**

|Column|Description|
|---|---|
|duration_mins|Total duration of the user's active session in minutes.|
|started_date|Start date and time of the user's session.|
|ended_date|End date and time of the user's session.|
|device_os|Operating system of the device from which session was active.|

**package_data table**

|Column|Description|
|---|---|
|package_id|Unique ID of the data package.|
|package_version|Version of the data package.|
|package_owner_id|Unique ID of the owner of the data package.|
|package_owner_name|Username of the owner of the data package.|
|package_owner_display_name|Display Name of the owner of the data package.|
|package_owner_avatar_url|URL of the owner's avatar.|
|package_is_partial|Indicates whether the package is partial (1 - Yes, 0 - No).|