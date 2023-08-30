Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column | Description |
| --- | --- |
| event_name | Indicates the category or type of event that took place, such as a message sent, an application command used, premium_upsell_viewed, etc. These event names help identify the specific action performed. |
| day | Represents the date the respective event took place, it is in 'YYYY-MM-DD' format. |
| hour | Indicates the hour (in 24-hr format) when the event occurred. |
| occurrence_count | Tracks the number of times a particular event occurred. | 
| associated_channel_id | Refers to the ID of the related channel, if applicable. It links this event to a specific channel. |
| associated_guild_id | Contains the ID of the associated guild, if applicable. It ties the event to a specific guild. |
| associated_user_id | Specifies the ID of the user connected with the event, if applicable. It relates the event with a specific user. |
| extra_field_1 | An extra field to accommodate varying attributes based on the event_type. Could be utilized for instance in storing names of emojis for an add_reaction event. |
| extra_field_2 | Another extra field to accommodate varying attributes based on the event_type. Could be for instance used in storing custom emoji information in add_reaction events. |

**dm_channels_data table**

| Column | Description |
| --- | --- |
| channel_id | Contains Discord ID of the Direct Message (DM) channel. |
| dm_user_id | Stores the Discord ID of the user involved in the DM. |
| user_name | Stores the username of the user engaged in the DM. |
| display_name | Stores the display name of the user involved in the DM. |
| user_avatar_url | Contains the URL that points to the user's avatar. |
| total_message_count | Reflects the total number of messages exchanged in the DM. |
| total_voice_channel_duration | Represents the total duration the user was involved in voice channels while in the DM. |
| sentiment_score | Indicates the overall sentiment score derived from the message contents in the DM. |

**guild_channels_data table**

| Column | Description |
| --- | --- |
| channel_id | Indicates the Discord ID of the guild channel. |
| guild_id | Contains the Discord ID of the guild associated with the channel. |
| channel_name | Stores the name of the guild channel. |
| total_message_count | Captures the total number of messages exchanged in the guild channel. |
| total_voice_channel_duration | Contains the total duration users were involved in voice channels while in the guild. |

**guilds table**

| Column | Description |
| --- | --- |
| guild_id | Shows the Discord ID of the guild. |
| guild_name | Stores the name of the guild. |
| total_message_count | Reflects the total number of messages exchanged in the guild. |