Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**Table: activity**
|Column|Description|
|--|--|
|event_name|Contains the type of the events occurred like message_sent, guild_joined, application_command_used, add_reaction, app_opened.|
|day|The date on which the activity occurred in the format 'YYYY-MM-DD'.|
|hour|The hour of the day (in 24-hour format) during which the activity occurred.|
|occurrence_count|The number of times that the specific event occurred.|
|associated_channel_id|The ID of the channel with which the activity is associated.|
|associated_guild_id|The ID of the guild with which the activity is associated.|
|associated_user_id|The ID of the user with which the activity is associated.|
|extra_field_1|An additional field for storing extra data related to the event, such as emoji name, operating system, etc. depending on the event type.|
|extra_field_2|Another additional field for storing extra data related to the event like whether emoji is custom or not.|

**Table: dm_channels_data**
|Column|Description|
|--|--|
|channel_id|Unique identifier of the direct message (DM) channel.|
|dm_user_id|Unique identifier of the user involved in the direct message conversation.|
|user_name|The original discord username of the user.|
|display_name|The display name of the user. (It can be changed per server).|
|user_avatar_url|The URL of the avatar of the user.|
|total_message_count|The total number of messages in the direct message conversation.|
|total_voice_channel_duration|The total time spent by the user in voice channels associated with the conversation.|
|sentiment_score|The sentiment score for the messages in the conversation.|

**Table: guild_channels_data**
|Column|Description|
|--|--|
|channel_id|Unique identifier of the guild channel.|
|guild_id|Unique identifier of the guild.|
|channel_name|The name of the guild channel.|
|total_message_count|The total number of messages in the guild channel.|
|total_voice_channel_duration|The total time spent by users in the voice channels of the guild channel.|

**Table: guilds**
|Column|Description|
|--|--|
|guild_id|Unique identifier of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages exchanged in the guild.|

**Table: payments**
|Column|Description|
|--|--|
|payment_id|Unique identifier of the payment.|
|payment_date|The date when the payment was made in the format 'YYYY-MM-DD'.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency in which the payment was made.|
|payment_description|The description of the payment.|

**Table: voice_sessions**
|Column|Description|
|--|--|
|channel_id|Unique ID identifier of the voice channel.|
|guild_id|Unique identifier of the guild.|
|duration_mins|The duration (in minutes) of the voice session.|
|started_date|The date and time when the voice session started.|
|ended_date|The date and time when the voice session ended.|

**Table: sessions**
|Column|Description|
|--|--|
|started_date|The date and time when the session started.|
|ended_date|The date and time when the session ended.|
|duration_mins|The duration (in minutes) of the session.|
|device_os|The operating system of the device where the session was initiated.|

**Table: package_data**
|Column|Description|
|--|--|
|package_id|Unique identifier of the package.|
|package_version|The version of the package.|
|package_owner_id|Unique identifier of the owner of the package.|
|package_owner_name|Username of the owner of the package.|
|package_owner_display_name|Display name of the owner of the package.|
|package_owner_avatar_url|The URL of the avatar of the owner of the package.|