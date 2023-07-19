Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description
|------|-----------|
|event_name| Name of the event that took place in Discord.| 
|day| The date in yyyy-mm-dd format when the event occured.|
|hour| The hour (in 24 hours format) when the event occured.|
|occurence_count| Number of times this particular event has occurred in the set duration (on the specific date at the particular hour).|
|associated_channel_id| ID of the Channel associated with the event. This can be null for events that is not related to any channel.|
|associated_guild_id| ID of the Guild associated with the event. This can be null for events that is not related to any guild.|
|associated_user_id| ID of the User associated with the event. This can be null for events that is not related to any user.|
|extra_field_1| Additional field to store more event-specific data. It's usage and value vary depends on the `event_name`|
|extra_field_2| Additional field to store more event-specific data. It's usage and value vary depends on the `event_name`|

**dm_channels_data table**
|Column|Description
|------|-----------|
|channel_id| ID of the direct message channel.|
|dm_user_id| ID of the user in the direct message channel.|
|user_name| Name of the user in the direct message channel.|
|display_name| Display name of the user in the direct message channel.|
|user_avatar_url| URL of the avatar of the user in the direct message channel.|
|total_message_count| Total number of messages sent in the direct message channel.|
|total_voice_channel_duration| Total duration in minutes of voice channel activity in the direct message channel.|
|sentiment_score| Sentiment score of the messages in the direct message channel.

**guild_channels_data table**
|Column|Description
|------|-----------|
|channel_id| ID of the guild channel.|
|guild_id| ID of Guild of the channel.|
|channel_name| Name of the Guild channel.|
|total_message_count| Total number of messages sent in the Guild channel.|
|total_voice_channel_duration| Total duration in minutes of voice channel activity in the Guild channel.

**guilds table**
|Column|Description
|------|----------|
|guild_id| ID of the Guild.|
|guild_name| Name of the Guild.|
|total_message_count|Total number of messages sent in the Guild.

**payments table**
|Column|Description
|------|-----------|
|payment_id| ID of the payment transaction.|
|payment_date| Date when the payment was made.|
|payment_amount| Amount of the transaction.|
|payment_currency| Currency used in the transaction.|
|payment_description| Description of the payment.

**voice_sessions table**
|Column|Description
|------|-----------|
|channel_id| ID of voice channel.|
|guild_id|ID of the guild where the voice channel exists.|
|duration_mins|Total duration in minutes spent in the voice channel.|
|started_date| Timestamp when the voice session started.|
|ended_date| Timestamp when the voice session ended.|

**sessions table**
|Column|Description
|------|-----------|
|duration_mins| Total duration in minutes of the session.|
|started_date| Timestamp when the session started.|
|ended_date| Timestamp when the session ended.|
|device_os|The operating system of the device user used during the session.

**package_data table**
|Column|Description
|------|-----------|
|package_id| ID of user's data package.|
|package_version| Version of the data package.|
|package_owner_id| ID of the owner of the data package. |
|package_owner_name| Name of the owner of the data package. |
|package_owner_display_name| Display Name of the owner of the data package. |
|package_owner_avatar_url| URL of the avatar of the owner of the data package.|
|package_is_partial| Indicator if the package is partial (1) or not (0).