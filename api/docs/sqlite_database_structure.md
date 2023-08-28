Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


I will provide a description for each column based on the code provided above and some common database knowledge:

**DM_CHANNEL_DATA table**
|Column|Description|
|---|---|
|channel_id|Unique identifier of a DM channel.|
|dm_user_id|Unique identifier of a USER in a DM channel.|
|user_name|The username of a user in a DM channel.|
|display_name|The display name of a user in a DM channel.|
|user_avatar_url|The URL of the avatar of a user in a DM channel.|
|total_message_count|The total number of messages in a DM channel.|
|total_voice_channel_duration|The total duration of voice activity in a DM channel.|
|sentiment_score|The sentiment score of conversation in a DM channel.|

**GUILD_CHANNELS_DATA table**
|Column|Description|
|---|---|
|channel_id|Unique identifier of a guild channel.|
|guild_id|Unique identifier of a guild.|
|channel_name|The name of a guild channel.|
|total_message_count|The total number of messages in a guild channel.|
|total_voice_channel_duration|The total duration of voice activity in a guild channel.|

**ACTIVITY table**
|Column|Description|
|---|---|
|event_name|The name of the event.|
|day|The day on which the event occurred.|
|hour|The hour at which the event occurred.|
|occurence_count|The number of occurrences of the event.|
|associated_channel_id|The channel associated with the event.|
|associated_guild_id|The guild associated with the event.|
|associated_user_id|The user associated with the event.|
|extra_field_1|Extra field for flexibility in data storage.|
|extra_field_2|Extra field for flexibility in data storage.|

**GUILDS table**
|Column|Description|
|---|---|
|guild_id|Unique identifier of a guild.|
|guild_name|The name of a guild.|
|total_message_count|The total number of messages in a guild.|

**PAYMENTS table**
|Column|Description|
|---|---|
|payment_id|Unique identifier of a payment.|
|payment_date|The date on which the payment was made.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|The description of the payment.|

**VOICE_SESSIONS table**
|Column|Description|
|---|---|
|channel_id|Unique identifier of a voice channel.|
|guild_id|Unique identifier of a guild.|
|duration_mins|The duration of the voice session in minutes.|
|started_date|The date when the voice session started.|
|ended_date|The date when the voice session ended.|

**SESSIONS table**
|Column|Description|
|---|---|
|duration_mins|The duration of the session in minutes.|
|started_date|The date when the session started.|
|ended_date|The date when the session ended.|
|device_os|The operating system of the device used for the session.|

**PACKAGE_DATA table**
|Column|Description|
|---|---|
|package_id|Unique identifier of a package.|
|package_version|The version of the package.|
|package_owner_id|The user id of the package owner.|
|package_owner_name|The username of the package owner.|
|package_owner_display_name|The display name of the package owner.|
|package_owner_avatar_url|The avatar URL of the package owner.|
|package_is_partial|The status indicating if the package is partial.|