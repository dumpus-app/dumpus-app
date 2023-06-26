Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|---|---|
|event_name|The type of activity event, such as "message_sent", "guild_joined", or "application_command_used".|
|day|The date of the event in YYYY-MM-DD format.|
|hour|The hour of the day of the event (in 24 hour format).|
|occurence_count|The number of occurrences of the event in the specified hour.|
|associated_channel_id|The ID of the channel associated with the event, if applicable.|
|associated_guild_id|The ID of the guild associated with the event, if applicable.|
|associated_user_id|The ID of the user associated with the event, if applicable.|

**dm_channels_data table**
|Column|Description|
|---|---|
|channel_id|The ID of the DM channel.|
|dm_user_id|The ID of the user participating in the DM channel.|
|user_name|The username of the user participating in the DM channel.|
|display_name|The display name of the user participating in the DM channel.|
|user_avatar_url|The URL of the user's avatar image.|
|total_message_count|The total number of messages sent in the DM channel.|
|total_voice_channel_duration|The total duration of voice calls in the DM channel, in minutes.|
|sentiment_score|The sentiment score of the messages in the DM channel, calculated through some sentiment analysis algorithm.|

**guild_channels_data table**
|Column|Description|
|---|---|
|channel_id|The ID of the guild channel.|
|guild_id|The ID of the guild to which the channel belongs.|
|channel_name|The name of the guild channel.|
|total_message_count|The total number of messages sent in the guild channel.|
|total_voice_channel_duration|The total duration of voice calls in the guild channel, in minutes.|

**guilds table**
|Column|Description|
|---|---|
|guild_id|The ID of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages sent in the guild across all channels.|

**payments table**
|Column|Description|
|---|---|
|payment_id|The unique ID of the payment event.|
|payment_date|The date of the payment in YYYY-MM-DD format.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|A description of the payment event.|

**voice_sessions table**
|Column|Description|
|---|---|
|channel_id|The ID of the channel where the voice session took place.|
|guild_id|The ID of the guild where the voice session took place.|
|duration_mins|The duration of the voice session, in minutes.|
|started_date|The starting date and time of the voice session in YYYY-MM-DD HH:MM format.|
|ended_date|The ending date and time of the voice session in YYYY-MM-DD HH:MM format.|

**package_data table**
|Column|Description|
|---|---|
|package_id|The unique ID of the data package.|
|package_version|The version of the data package.|
|package_owner_id|The ID of the user who owns the data package.|
|package_owner_name|The username of the package owner.|
|package_owner_display_name|The display name of the package owner.|
|package_owner_avatar_url|The URL of the package owner's avatar image.