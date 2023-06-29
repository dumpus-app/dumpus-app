Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

|Column|Description|
|---|---|
|event_name|This field holds the value of the event performed. For example, "message_sent", "guild_joined", etc.|
|day|The date when the event occurred. The date is in the format 'YYYY-MM-DD'.|
|hour|The hour at which the event took place. This is an integer value ranging from 0 to 23.|
|occurrence_count|This field holds the count of how many times an event occurred during the given date and hour.|
|associated_channel_id|The ID of the channel related to the event. It is 'None' for events which are not related to any particular channel.|
|associated_guild_id|The ID of the guild associated with the event. It is 'None' for events not related to any particular guild.|
|associated_user_id|The ID of the user associated with the event. It is 'None' for events not related to any particular user.|
|extra_field_1|This field contains extra information associated with an event. For example, it could hold the application ID for "application_command_used" events or the operating system for "app_opened" events.|
|extra_field_2|This field contains extra information associated with an event. For example, it could hold specific emoji name for "add_reaction" events.|

**dm_channels_data table**

|Column|Description|
|---|---|
|channel_id|This field holds the ID of the Direct Message (DM) channel.|
|dm_user_id|This field contains the ID of the user associated with the DM.|
|user_name|This field holds the username of the user.|
|display_name|This field contains the user's display name.|
|user_avatar_url|This field holds the URL for the user's avatar.|
|total_message_count|The total number of messages in the DM channel.|
|total_voice_channel_duration|The total duration for which voice channel is used in the DM channel. It is 0 as DM channels don't have voice channels.|
|sentiment_score|The sentiment score of the DM channel.|

**guild_channels_data table**

|Column|Description|
|---|---|
|channel_id|The Field holds the ID of the guild channel.|
|guild_id|This field holds the ID of the guild associated with the channel.|
|channel_name|This field contains the name of the channel.|
|total_message_count|The total number of messages in the guild channel.|
|total_voice_channel_duration|The total duration for which voice channel is used in the guild channel.|

**guilds table**

|Column|Description|
|---|---|
|guild_id|This field holds the ID of the guild.|
|guild_name|The name of the guild.|
|total_message_count|The total number of messages sent in the guild.|

**payments table**

|Column|Description|
|---|---|
|payment_id|This field holds the ID of the payment.|
|payment_date|The date when the payment was made. The date is in the format 'YYYY-MM-DD'.|
|payment_amount|The amount of the payment.|
|payment_currency|The currency in which the payment was made.|
|payment_description|A description of the payment.|

**voice_sessions table**

|Column|Description|
|---|---|
|channel_id|This field holds the ID of the voice channel.|
|guild_id|This field contains the ID of the guild associated with the voice channel.|
|duration_mins|The duration of the voice session in minutes.|
|started_date|The start date and time of the voice session.|
|ended_date|The end date and time of the voice session.|

**package_data table**

|Column|Description|
|---|---|
|package_id|This field holds the ID of the package.|
|package_version|The version of the package.|
|package_owner_id|The ID of the owner of the package.|
|package_owner_name|The username of the owner of the package.|
|package_owner_display_name|The display name of the owner of the package.|
|package_owner_avatar_url|The URL of the owner's avatar.|

Note: All the IDs in the tables are provided in a unique format provided by Discord and does not hold any specific pattern. They are simply identifiers for different entities.