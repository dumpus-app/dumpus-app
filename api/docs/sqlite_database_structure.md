Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**

| Column               | Description                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| event_name           | The name of the event that occurred, such as "message_sent" or "guild_joined".                                                                                                |
| day                  | The day the event occurred, formatted as 'YYYY-MM-DD'.                                                                                                                         |
| hour                 | The hour (integer) the event occurred, in the 24-hour format.                                                                                                                  |
| occurence_count      | The number of times the event occurred during the specified day and hour.                                                                                                      |
| associated_dm_user_id    | The associated Direct Message (DM) user ID, if a message_sent event occurred in a DM channel. Null if the event occurred in a guild channel or is a guild_joined event.                    |
| associated_channel_id| The ID of the channel where the event occurred.                                                                                                                                |
| associated_guild_id  | The ID of the guild that the event is associated with.                                                                                            |

**dm_channels_data table**

| Column                     | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| channel_id                 | The ID of the Direct Message (DM) channel.                        |
| dm_user_id                 | The ID of the user associated with the DM channel.                |
| user_name                  | The username of the DM user.                                      |
| display_name               | The display name of the DM user.                                  |
| user_avatar_url            | The avatar URL of the DM user.                                    |
| total_message_count        | The total number of messages in the DM channel.                   |
| total_voice_channel_duration | The total duration of voice sessions in the DM channel.           |
| sentiment_score            | The overall sentiment score of the messages in the DM channel.    |

**guild_channels_data table**

| Column                     | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| channel_id                 | The ID of the guild channel.                                      |
| guild_id                   | The ID of the guild the channel belongs to.                       |
| channel_name               | The name of the guild channel.                                    |
| total_message_count        | The total number of messages in the guild channel.                |
| total_voice_channel_duration | The total duration of voice sessions in the guild channel.        |

**guilds table**

| Column               | Description                               |
| -------------------- | ------------------------------------------|
| guild_id             | The ID of the guild.                      |
| guild_name           | The name of the guild.                    |
| total_message_count  | The total number of messages in the guild.|

**payments table**

| Column              | Description                                  |
| ------------------- | ---------------------------------------------|
| payment_id          | The ID of the payment.                       |
| payment_date        | The date the payment was made, in 'YYYY-MM-DD' format.|
| payment_amount      | The amount of the payment.                   |
| payment_currency    | The currency of the payment.                 |
| payment_description | The description of the payment.              |

**voice_sessions table**

| Column          | Description                                                      |
| --------------- | ----------------------------------------------------------------|
| channel_id      | The ID of the channel where the voice session took place.       |
| guild_id        | The ID of the guild where the voice session took place.         |
| duration_mins   | The duration of the voice session, in minutes.                  |
| started_date    | The date and time when the voice session started.               |
| ended_date      | The date and time when the voice session ended.                 |

**package_data table**

| Column                   | Description                                       |
| ------------------------ | --------------------------------------------------|
| package_id               | The package ID (identifier).                      |
| package_version          | The version of the package.                       |
| package_owner_name       | The owner's username of the package              |
| package_owner_display_name | The display name of the package owner.           |
| package_owner_avatar_url | The avatar URL of the package owner.              |