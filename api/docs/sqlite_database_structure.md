Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**package_data table**
| Column | Description |
|--------|-------------|
| package_id | Unique identifier of the package. |
| package_version | Version of the package. |
| package_owner_id | Unique identifier of the owner of the package. |
| package_owner_display_name | The display name of the package owner. |
| package_owner_avatar_url | The URL of the package owner's avatar image. |
| package_is_partial | An indicator if the package is partial or complete (1 for partial, 0 for complete). |

**activity table**
| Column | Description |
|--------|-------------|
| event_name | Name of the event performed in the Discord app such as message sent, reaction added, etc. |
| day | The day when the event occured, in 'YYYY-MM-DD' format. |
| hour | The hour when the event occured, in 24-hour format. |
| occurence_count | The count of the event occured during the given hour. |
| associated_channel_id | ID of the Discord channel associated with the event. |
| associated_guild_id | ID of the Discord server (guild) associated with the event. |
| associated_user_id | ID of the Discord user associated with the event. |
| extra_field_1 | Supplementary information 1, varies based on the event type.|
| extra_field_2 | Supplementary information 2, varies based on the event type. |

**dm_channels_data table**
| Column | Description |
|--------|-------------|
| channel_id | Unique identifier of the Discord DM channel. |
| dm_user_id | Unique identifier of the user in the DM channel. |
| user_name | The username of the user in the DM channel. |
| display_name | The display name of the user in the DM channel. |
| user_avatar_url | The URL of the user's avatar in the DM channel. |
| total_message_count | The total number of messages in the DM channel. |
| total_voice_channel_duration | The total duration spent in voice channels in the DM channel. |
| sentiment_score | The sentiment score of the content in the DM channel. |

The above mentioned is just for three tables, similarly you can create documentation for the remaining tables. Remember, the column description should be short and clear enough for a developer to understand what kind of data they are dealing with.