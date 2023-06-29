Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**Here are the generated tables based on the provided code snippet:**

## Table Information

---

### Table: Activity
| Column | Description |
| ------ | ----------- |
| event_name | Records the type of activity undertaken by the user. Can contain values like 'message_sent', 'guild_joined', 'application_command_used', etc. |
| day | The day in 'YYYY-MM-DD' format when the particular event took place. |
| hour | Hour of the day (24-hour format) when the particular event took place. |
| occurrence_count | Number of times the event took place. |
| associated_channel_id | The ID of the channel associated with the event, if any. |
| associated_guild_id | The ID of the guild associated with the event, if any. |
| associated_user_id | The ID of the user associated with the event, if any. |
| extra_field_1 | Extra information related to the event. Could be emoji_name or device OS etc. depending on the event. |
| extra_field_2 | More extra information related to the event. Could be information like whether the emoji is custom or not etc. |

---

### Table: Dm_Channels_Data
| Column | Description |
| ------ | ----------- |
| channel_id | Numeral ID of the channel. |
| dm_user_id | Unique ID of the user with whom a DM has been opened. |
| user_name | Username of the DM recipient. |
| display_name | Display name of the DM recipient. |
| user_avatar_url | URL of the avatar picture of the DM recipient. |
| total_message_count | Total number of messages exchanged in the channel. |
| total_voice_channel_duration | Total duration spent in voice channels. |
| sentiment_score | Sentiment score associated with the channel. |

---

### Table: Guild_Channels_Data
| Column | Description |
| ------ | ----------- |
| channel_id | Unique ID of the channel. |
| guild_id | Unique ID of the guild the channel belongs to. |
| channel_name | Name of the channel. |
| total_message_count | Total number of messages in the channel. |
| total_voice_channel_duration | Total amount of time spent in voice channels in the same guild. |

---

### Table: Guilds
| Column | Description |
| ------ | ----------- |
| guild_id | Unique ID of the guild. |
| guild_name | Name of the guild. |
| total_message_count | Total number of messages exchanged in the guild. |

---

### Table: Payments
| Column | Description |
| ------ | ----------- |
| payment_id | Unique ID of the payment. |
| payment_date | Date of the payment in 'YYYY-MM-DD' format. |
| payment_amount | Amount of the payment. |
| payment_currency | Currency used in the payment. |
| payment_description | Description of the payment. |

---

### Table: Voice_Sessions
| Column | Description |
| ------ | ----------- |
| channel_id | Unique ID of the channel. |
| guild_id | Unique ID of the guild. |
| duration_mins | Duration of the voice session in minutes. |
| started_date | Date and time when the voice session started. |
| ended_date | Date and time when the voice session ended. |

---

### Table: Sessions
| Column | Description |
| ------ | ----------- |
| started_date | Date and time when the session started. |
| ended_date | Date and time when the session ended. |
| duration_mins | Duration of the session in minutes. |
| device_os | Operating system of the device from which the session was initiated. |

---

### Table: Package_Data
| Column | Description |
| ------ | ----------- |
| package_id | Unique ID of the package. |
| package_version | The version of the package. |
| package_owner_id | Unique ID of the owner of the package. |
| package_owner_name | Name of the owner of the package. |
| package_owner_display_name | Display name of the owner of the package. |
| package_owner_avatar_url | URL of the avatar picture of the owner of the package. |

---

**Note:** Some assumptions on the data type and values were made based on the inserted values and the executed queries.