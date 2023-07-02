Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**1. activity Table**
|Column|Description
|------|-----------|
|event_name|The type of event occurring. The event could be ('message_sent', 'guild_joined', 'application_command_used', 'add_reaction', 'app_opened').|
|day|The day of the activity event in 'Year-Month-Day' format.|
|hour|The hour of the activity event.|
|occurrence_count|The number of occurrences of the particular event.|
|associated_channel_id|Associated discord channel_id, only applies to the 'message_sent' and 'add_reaction' events. For others, it is None.|
|associated_guild_id| Associated discord guild_id, only applies to the 'guild_joined' and 'application_command_used' events. For others, it is None.|
|associated_user_id| ID of the user associated with the event, value is always None in this code.|
|extra_field_1| Extra field that holds application_id, emoji_name, os, based on the 'event_name'.|
|extra_field_2| Extra field that depicts if an emoji is_custom_emoji for 'add_reaction' event, else None.|

**2. dm_channels_data Table**
|Column|Description|
|------|-----------|
|channel_id|The ID of the direct message channel.|
|dm_user_id|The ID of the user exchanging direct messages.|
|user_name|The username of the dm_user_id.|
|display_name|The display name of the dm_user_id.|
|user_avatar_url|The avatar URL of the dm_user_id.|
|total_message_count|The overall total message count of the direct message exchange.|
|total_voice_channel_duration|The total duration of voice channel, value is always 0.|
|sentiment_score|The score calculating the sentiment of the message exchange.|

**3. guild_channels_data Table**
|Column|Description|
|------|-----------|
|channel_id|The ID of the guild's channel.|
|guild_id|The ID of the guild.|
|channel_name|The name of the channel within the guild.|
|total_message_count|The total number of messages exchanged in the guild's channel.|
|total_voice_channel_duration|The total duration of voice channel, value is always 0.|

**4. guilds Table**
|Column|Description|
|------|-----------|
|guild_id|The ID of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages sent across all channels in the guild.|

**5. payments Table**
|Column|Description|
|------|-----------|
|payment_id|The ID of the payment|
|payment_date|The date of the payment in 'Year-Month-Day' format.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency in which the payment was made.|
|payment_description|The brief description or the purpose of the payment.|

**6. voice_sessions Table**
|Column|Description|
|------|-----------|
|channel_id|The ID of the voice channel.|
|guild_id|The ID of the guild.|
|duration_mins|Duration of the voice session measured in minutes. |
|started_date|The date (YYYY-mm-dd) when the voice session started.|
|ended_date|The date (YYYY-mm-dd) when the voice session ended.|

**7. sessions Table**
|Column|Description|
|------|-----------|
|started_date|The date (YYYY-mm-dd) when the session started.|
|ended_date|The date (YYYY-mm-dd) when the session ended.|
|duration_mins| Duration of the session measured in minutes.|
|device_os| Operating system of the device where the session ran.|

**8. package_data Table**
|Column|Description|
|------|-----------|
|package_id|The ID of the data package.|
|package_version|The version of the data package.|
|package_owner_id|The ID of the user who owns the package.|
|package_owner_name|The username of the package owner.|
|package_owner_display_name|The display-name of the package owner.|
|package_owner_avatar_url|The URL of the avatar of the package owner.|