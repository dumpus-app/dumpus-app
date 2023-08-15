Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

|Column|Description|
|---|---|
|event_name|Represents the type of activity event. It may consist of: 'message_sent', 'guild_joined', 'application_command_used', 'add_reaction', 'app_opened', 'email_opened', 'login_successful', 'app_crashed', 'user_avatar_updated', 'oauth2_authorize_accepted', 'remote_auth_login', 'notification_clicked', 'captcha_served', 'voice_message_recorded', 'message_reported', 'message_edited', 'premium_upsell_viewed'.
|day|Date of the event in the format 'YYYY-MM-DD'.|
|hour|Hour of the day when event occurred(24-hour format).|
|occurence_count|Number of times the event occurred in that date and hour.|
|associated_channel_id|Channel ID associated with the event. It is NULL for events that are not related to any specific channel.|
|associated_guild_id|Guild ID associated with the event. It is NULL for events that are not related to any specific guild.|
|associated_user_id|User ID associated with the event. It is not being used in this code snippet, so will always be NULL.|
|extra_field_1|Extra field used for additional information like 'application_id', 'emoji_name', 'os' depending on the 'event_name'.|
|extra_field_2|Another extra field used for additional information like 'is_custom' for events like 'add_reaction'.|

**dm_channels_data table**

|Column|Description|
|---|---|
|channel_id|Identifier of the channel where Direct Messages (DM) are sent.|
|dm_user_id|User ID of the user who the DM channel is with.|
|user_name|Username of the aforementioned user.|
|display_name|Display name of the aforementioned user.|
|user_avatar_url|URL for the avatar of the aforementioned user.|
|total_message_count|Total number of messages in the DM.|
|total_voice_channel_duration|Total duration of all voice sessions in the channel. Always 0 in this code snippet.|
|sentiment_score|Sentiment score of the messages in the DM.|

**guild_channels_data table**

|Column|Description|
|---|---|
|channel_id|Identifier of the channel in the guild.|
|guild_id|Identifier of the guild.|
|channel_name|Name of the channel.|
|total_message_count|Total number of messages in the channel.|
|total_voice_channel_duration|Total duration of all voice sessions in the guild. Always 0 in this code snippet.|


**guilds table**

|Column|Description|
|---|---|
|guild_id|Identifier of the guild.|
|guild_name|Name of the guild.|
|total_message_count|Total number of messages sent in the guild.|

**payments table**

|Column|Description|
|---|---|
|payment_id|Identifier of the payment.|
|payment_date|Date of payment in the format 'YYYY-MM-DD'.|
|payment_amount|Amount of the payment.|
|payment_currency|Currency of the payment.|
|payment_description|Description of the payment.|

**voice_sessions table**

|Column|Description|
|---|---|
|channel_id|Identifier of the voice channel.|
|guild_id|Identifier of the guild where the channel is.|
|duration_mins|Duration of the voice session in the channel in minutes.|
|started_date|Date when voice session started.|
|ended_date|Date when voice session ended.|

**sessions table**

|Column|Description|
|---|---|
|duration_mins|Duration of the session in minutes.|
|started_date|Date when the session started.|
|ended_date|Date when the session ended.|
|device_os|Operating system of the device used in the session.|

**package_data table**

|Column|Description|
|---|---|
|package_id|Identifier of the package.|
|package_version|Version of the package.|
|package_owner_id|User ID of the owner of the package.|
|package_owner_name|Username of the owner of the package.|
|package_owner_display_name|Display name of the owner of the package.|
|package_owner_avatar_url|URL for the avatar of the owner of the package.|
|package_is_partial|Indicates whether the package is partial (1) or not (0).|