Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
|Column|Description
|--|--|
|event_name|Indicates the type of event recorded. For example: 'message_sent', 'guild_joined', 'application_command_used', 'add_reaction', 'app_opened'.|
|day|The date on which the event occurred, formatted as 'YYYY-MM-DD'.|
|hour|The hour during which the event occurred, given as an integer from 0-23.|
|occurrence_count|The number of times this event occurred during this hour on the given day.|
|associated_channel_id|ID of the channel associated with the event.| 
|associated_guild_id|ID of the guild associated with the event.| 
|associated_user_id|ID of the user or application associated with the event. For 'application_command_used' events only.| 
|extra_field_1|Additional data associated with the event. Can contain the name of the emoji for 'add_reaction' events, the operating system for 'app_opened' events, and the application ID for 'application_command_used' events.|
|extra_field_2|Additional data associated with the event. Used to indicate if an emoji is custom ('1') or not ('0') for 'add_reaction' events.|

**dm_channels_data table**
|Column|Description
|--|--|
|channel_id|The unique identifier for the direct message channel.|
|dm_user_id|The unique identifier for the user involved in the direct message channel.|
|user_name|The username of the user involved in the direct message channel.|
|display_name|The display name of the user involved in the direct message channel.|
|user_avatar_url|URL of the user’s avatar.|
|total_message_count|The total number of messages exchanged in the direct message channel.|
|total_voice_channel_duration|The total duration of voice channel activity in the direct message channel.|
|sentiment_score|The sentiment score of the messages in the direct message channel.|

**guild_channels_data table**
|Column|Description
|--|--|
|channel_id|The unique identifier for the guild channel.|
|guild_id|The unique identifier for the guild the channel belongs to.|
|channel_name|The name of the channel.|
|total_message_count|The total number of messages sent in the channel.|
|total_voice_channel_duration|The total time spent in the voice channels of the discord guild.|

**guilds table**
|Column|Description
|--|--|
|guild_id|The unique identifier for the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages sent across all channels in the guild.|

**payments table**
|Column|Description
|--|--|
|payment_id|A unique identifier for the payment transaction.|
|payment_date|The date the payment was made.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency in which the payment was made.|
|payment_description|Description of the payment transaction.|

**voice_sessions table**
|Column|Description
|--|--|
|channel_id|The unique identifier for the channel in which the voice session occurred.|
|guild_id|The unique identifier for the guild in which the voice session occurred.|
|duration_mins|The duration of the voice session, measured in minutes.|
|started_date|The starting date and time of the voice session.|
|ended_date|The ending date and time of the voice session.|

**sessions table**
|Column|Description
|--|--|
|duration_mins|The duration of the session, in minutes.|
|started_date|The starting date and time of the session.|
|ended_date|The ending date and time of the session.|
|device_os|The operating system of the device used for the session.|

**package_data table**
|Column|Description
|--|--|
|package_id|The unique identifier for the data package.|
|package_version|The version of the data package.|
|package_owner_id|The unique identifier for the owner of the package.|
|package_owner_name|The username of the package owner.|
|package_owner_display_name|The display name of the package owner.|
|package_owner_avatar_url|The URL to the avatar image of the package owner.|