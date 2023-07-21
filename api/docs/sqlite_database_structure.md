Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description|
|-|-|
|event_name|Event type that occurred like 'guild_joined', 'application_command_used', 'app_opened' etc.|
|day|The day (YYYY-MM-DD format) when the event occurred.|
|hour|The hour (0-23) when the event occurred.|
|occurence_count|Number of times the event occurred during the given hour.|
|associated_channel_id|Channel identifier associated with the event, if applicable.|
|associated_guild_id|Guild identifier associated with the event, if applicable.|
|associated_user_id|User identifier associated with the event, if applicable.|
|extra_field_1|Additional data related to the event. The content varies depending on the event_name.|
|extra_field_2|Additional data related to the event. The content varies depending on the event_name.|

**dm_channels_data table**
|Column|Description|
|-|-|
|channel_id|ID assigned to the Direct Message (DM).|
|dm_user_id|User ID of the user involved in the DM.|
|user_name|Username of the user involved in the DM.|
|display_name|Display name of the user involved in the DM.|
|user_avatar_url|URL of the user's avatar.|
|total_message_count|Total number of messages in the DM conversation.|
|total_voice_channel_duration|Total duration of voice calls in the DM conversation, if any.|
|sentiment_score|Score indicating the sentiment of the conversation (positive, negative, neutral) based on message content, if available.|

**guild_channels_data table**
|Column|Description|
|-|-|
|channel_id|Channel ID associated with the guild.|
|guild_id|ID assigned to the guild.|
|channel_name|Name of the channel in the guild.|
|total_message_count|Total number of messages in the channel.|
|total_voice_channel_duration|Total duration of voice calls in the channel, if any.|

**guilds table**
|Column|Description|
|-|-|
|guild_id|ID assigned to the guild.|
|guild_name|Name of the guild.|
|total_message_count|Total number of messages sent within the guild.|

**payments table**
|Column|Description|
|-|-|
|payment_id|ID assigned to the payment transaction.|
|payment_date|Date (YYYY-MM-DD format) of the payment.|
|payment_amount|Amount of the payment.|
|payment_currency|Currency of the payment.|
|payment_description|Description of the payment, if any.|

**voice_sessions table**
|Column|Description|
|-|-|
|channel_id|Channel ID where the voice session occurred.|
|guild_id|Guild ID where the voice session occurred, if applicable.|
|duration_mins|Duration of the voice session in minutes.|
|started_date|Start date and time (YYYY-MM-DD HH:MM:SS format) of the voice session.|
|ended_date|End date and time (YYYY-MM-DD HH:MM:SS format) of the voice session.|

**sessions table**
|Column|Description|
|-|-|
|duration_mins|Duration of the session in minutes.|
|started_date|Start date and time (YYYY-MM-DD HH:MM:SS format) of the session.|
|ended_date|End date and time (YYYY-MM-DD HH:MM:SS format) of the session.|
|device_os|Operating system of the device used in the session.|

**package_data table**
|Column|Description|
|-|-|
|package_id|ID assigned to the package.|
|package_version|Version of the package.|
|package_owner_id|User ID of the package owner.|
|package_owner_name|Username of the package owner.|
|package_owner_display_name|Display name of the package owner.|
|package_owner_avatar_url|URL of the package owner's avatar.|
|package_is_partial|Indicates if the package is partial (1 for Yes and 0 for No).|