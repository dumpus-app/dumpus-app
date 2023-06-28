Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|-|-|
|event_name|The type of event associated with the record. Examples include "message_sent", "guild_joined", and "application_command_used", among others.|
|day|The date the event took place, formatted as 'YYYY-MM-DD'.|
|hour|The hour during which the event took place, in 24h format.|
|occurence_count|The number of times the event occurred within the specified hour.|
|associated_channel_id|The ID of the channel related to the event, if any.|
|associated_guild_id|The ID of the guild related to the event, if any.|
|associated_user_id|The ID of the user related to the event, if any.|
|extra_field_1|An additional field for storing event-related details. Its usage varies depending on the event.|
|extra_field_2|Another additional field for storing event-related details. Its usage varies depending on the event.|

**dm_channels_data table**
|Column|Description|
|-|-|
|channel_id|The ID of the direct message (DM) channel.|
|dm_user_id|The ID of the user the direct messages are with.|
|user_name|The username of the DM user.|
|display_name|The display name of the DM user.|
|user_avatar_url|The URL of the avatar of the DM user.|
|total_message_count|The total count of messages in the DM channel.|
|total_voice_channel_duration|The total duration, in minutes, of voice sessions in the DM channel (currently always zero, reserved for future use).|
|sentiment_score|The sentiment score for the DM channel.|

**guild_channels_data table**
|Column|Description|
|-|-|
|channel_id|The ID of the channel.|
|guild_id|The ID of the guild the channel belongs to.|
|channel_name|The name of the channel.|
|total_message_count|The total count of messages in the channel.|
|total_voice_channel_duration|The total duration, in minutes, of voice sessions in the channel.|

**guilds table**
|Column|Description|
|-|-|
|guild_id|The ID of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total count of messages sent within the guild.|

**payments table**
|Column|Description|
|-|-|
|payment_id|The ID of the payment.|
|payment_date|The date the payment was made, formatted as 'YYYY-MM-DD'.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency in which the payment was made.|
|payment_description|A description of what the payment is for.|

**voice_sessions table**
|Column|Description|
|-|-|
|channel_id|The ID of the channel in which the voice session occurred.|
|guild_id|The ID of the guild in which the voice session took place.|
|duration_mins|The duration of the voice session, in minutes.|
|started_date|The date the voice session began, formatted as 'YYYY-MM-DD HH:MM:SS'.|
|ended_date|The date the voice session ended, formatted as 'YYYY-MM-DD HH:MM:SS'.|

**package_data table**
|Column|Description|
|-|-|
|package_id|The unique identifier of the package.|
|package_version|The version of the package.|
|package_owner_id|The ID of the owner of the package.|
|package_owner_name|The username of the owner of the package.|
|package_owner_display_name|The display name of the owner of the package.|
|package_owner_avatar_url|The URL of the avatar of the package's owner.|