Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**1. activity table**

| Column | Description |
| --- | --- |
| event_name | This represents the name of the event (like 'message_sent', 'application_command_used', 'guild_joined' etc). |
| day | The day when the event occurred. Format: 'YYYY-MM-DD'. |
| hour | The hour of the day (in 24 hour format) when the event occurred. |
| occurrence_count | It's the number of times the event occurred in that hour of the day. |
| associated_channel_id | This is the ID of the channel associated with the event. |
| associated_guild_id | This is the ID of the guild associated with the event. |
| associated_user_id | This is the ID of the user associated with the event. |
| extra_field_1 | Extra field for additional information. |
| extra_field_2 | Another extra field for additional information. |

**2. dm_channels_data table**

| Column | Description |
| --- | --- |
| channel_id | The unique ID of the direct message channel. |
| dm_user_id | The unique ID of the User involved in the direct messaging. |
| user_name | The username of the user. |
| display_name | Display name of the user. |
| user_avatar_url | URL of the user's avatar image. |
| total_message_count | Total number of messages exchanged in the channel. |
| total_voice_channel_duration | Total duration user spent in voice channels. |
| sentiment_score | Score representing the sentiment analysis of the messages in the channel. |

**3. guild_channels_data table**

| Column | Description |
| --- | --- |
| channel_id | The unique ID of the guild channel. |
| guild_id | The unique ID of the guild associated with the channel. |
| channel_name | The name of the guild channel. |
| total_message_count | Total number of messages exchanged in the channel. |
| total_voice_channel_duration | Total duration users spent in voice channels of this guild. |

**4. guilds table**

| Column | Description |
| --- | --- |
| guild_id | The unique ID of the guild. |
| guild_name | The name of the guild. |
| total_message_count | Total number of messages exchanged in the guild. |

**5. payments table**

| Column | Description |
| --- | --- |
| payment_id | The unique ID of the payment. |
| payment_date | Date of the payment. Format: 'YYYY-MM-DD'. |
| payment_amount | Amount of the payment. |
| payment_currency | The currency in which the payment was made. |
| payment_description | Description of the payment. |

**6. voice_sessions table**

| Column | Description |
| --- | --- |
| channel_id | The unique ID of the voice channel. |
| guild_id | The unique ID of the guild associated with the voice channel. |
| duration_mins | Total duration of the voice session in minutes. |
| started_date | The date on which the voice session started. |
| ended_date | The date on which the voice session ended. |

**7. sessions table**

| Column | Description |
| --- | --- |
| duration_mins | Total duration of the session in minutes. |
| started_date | The date on which the session started. |
| ended_date | The date on which the session ended. |
| device_os | The Operating System of the device. |