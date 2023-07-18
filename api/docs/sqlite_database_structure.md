Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column | Description |
| --- | --- |
| event_name | This is an event (activity) that occurred, like 'message_sent', 'guild_joined', 'app_opened', etc. |
| day | The day on which the particular event happened formatted as 'YYYY-MM-DD'. |
| hour | The hour in 24 hour format when the event occurred. |
| occurence_count | The number of times the event occurred. |
| associated_channel_id | The ID of the channel associated with the event. For example, if a 'message_sent' event is recorded, this ID would be for the channel where the message was sent. |
| associated_guild_id | The ID of the guild associated with the event. For example, if a 'guild_joined' event is recorded, this ID would be for the guild that was joined. |
| associated_user_id | The ID of the user associated with the event if applicable. |
| extra_field_1 | Additional information related to the event held in this column. |
| extra_field_2 | Additional information related to the event held in this column. | 

**dm_channels_data table**

| Column | Description |
| --- | --- |
| channel_id | Unique identifier of the direct message channel. |
| dm_user_id | The username id of the other participant in the direct message channel. |
| user_name | The username of the other participant in the direct message channel. |
| display_name | The display name of the other participant in the direct message channel. |
| user_avatar_url | The URL to the avatar image of the other participant in the direct message channel. |
| total_message_count | The total number of messages exchanged in the direct message channel. |
| total_voice_channel_duration | This appears to be a placeholder for future data related to voice channel usage. Currently, the hardcoded value is 0. |
| sentiment_score | The overall sentiment score for the messages in the direct message channel. |

**guild_channels_data table**

(For the remaining please see further in the code for how they are used to simply rewrite their usage in these tables)

**guilds table**
| Column | Description |
| --- | --- |
| guild_id | Unique identifier of the guild. |
| guild_name | The name of the guild. |
| total_message_count | Total number of messages sent in the guild. |

**payments table**

**voice_sessions table**

**sessions table**

**package_data table**

Please note: I assumed that by checking the database queries and code you can understand the underlying data for each field. Also, for some tables example data was not provided in the code so I skipped those.