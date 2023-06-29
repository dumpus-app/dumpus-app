Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|-|-|
|event_name|The type of the event involved in the activity. It could be 'message_sent', 'guild_joined', 'application_command_used', 'add_reaction', etc.|
|day|The day the event occurred, formatted in '%Y-%m-%d' format. |
|hour|The hour when the event occurred.|
|occurence_count|The number of occurrences of the event.|
|associated_channel_id|The ID of the channel associated with the event. |
|associated_guild_id|The ID of the guild associated with the event. |
|associated_user_id|The ID of the user associated with the event. |
|extra_field_1|Additional field to store extra information about the event. This could include application ID or emoji name, depending on the event.|
|extra_field_2|Additional field to store extra information about the event. Could include information about whether an emoji is custom or not.|


**dm_channels_data table**
|Column|Description|
|-|-|
|channel_id|The ID of the direct message channel.|
|dm_user_id|The ID of the user involved in the direct message.|
|user_name|The username of the user.|
|display_name|The display name of the user.|
|user_avatar_url|The URL of the user's avatar.|
|total_message_count|The total number of messages in the direct message conversation.|
|total_voice_channel_duration|The total duration of voice channel activity.|
|sentiment_score|The sentiment score of the conversation.|


**guild_channels_data table**
|Column|Description|
|-|-|
|channel_id|The ID of the guild channel.|
|guild_id|The ID of the guild associated with the channel.|
|channel_name|The name of the channel.|
|total_message_count|The total number of messages in the channel.|
|total_voice_channel_duration|The total duration of voice channel activity.|


**guilds table**
|Column|Description|
|-|-|
|guild_id|The ID of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages in the guild.|


**payments table**
|Column|Description|
|-|-|
|payment_id|The ID of the payment.|
|payment_date|The date of the payment.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency of the payment.|
|payment_description|The description of the payment.|


**voice_sessions table**
|Column|Description|
|-|-|
|channel_id|The ID of the channel associated with the voice session.|
|guild_id|The ID of the guild associated with the voice session.|
|duration_mins|The duration of the voice session in minutes.|
|started_date|The start date and time of the voice session.|
|ended_date|The end date and time of the voice session.|


**package_data table**
|Column|Description|
|-|-|
|package_id|The ID of the data package.|
|package_version|The version of the data package.|
|package_owner_id|The ID of the owner of the data package.|
|package_owner_name|The name of the owner of the data package.|
|package_owner_display_name|The display name of the owner of the data package.|
|package_owner_avatar_url|The URL of the avatar of the data package owner.|