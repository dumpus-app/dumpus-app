Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


Here's the requested documentation in markdown format, providing a description for each table and its columns in the SQLite database:

---

**activity table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| event_name              | The name of the event recorded (e.g., 'message_sent', 'guild_joined').                      |
| day                     | The date of the event in 'YYYY-MM-DD' format (e.g., '2023-10-01').                          |
| hour                    | The hour of the event recorded in 24-hour format (0-23).                                     |
| occurrence_count        | The number of times the event occurred at that specific timestamp.                           |
| associated_channel_id   | The ID of the channel associated with the event, if applicable.                              |
| associated_guild_id     | The ID of the guild (server) associated with the event, if applicable.                      |
| associated_user_id      | The ID of the user associated with the event, if applicable.                                  |
| extra_field_1          | Additional field for custom data associated with the event (e.g., application ID).          |
| extra_field_2          | Additional field for custom data associated with the event (e.g., emoji name).              |

---

**dm_channels_data table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| channel_id              | The unique identifier for the direct message channel.                                         |
| dm_user_id              | The ID of the user in the direct message channel.                                            |
| user_name               | The name of the user associated with the channel.                                            |
| display_name            | The display name of the user associated with the channel.                                    |
| user_avatar_url         | The URL of the user's avatar image.                                                           |
| total_message_count     | The total number of messages sent in the direct message channel.                              |
| total_voice_channel_duration | The total duration (in minutes) the user spent in voice channels, if applicable.          |
| sentiment_score         | The sentiment score associated with the messages sent in the channel.                        |

---

**guild_channels_data table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| channel_id              | The unique identifier for the guild channel.                                                |
| guild_id                | The ID of the guild (server) that the channel belongs to.                                    |
| channel_name            | The name of the channel.                                                                     |
| total_message_count     | The total number of messages sent in the guild channel.                                      |
| total_voice_channel_duration | The total duration (in minutes) spent in the voice channel, if applicable.               |

---

**guilds table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| guild_id                | The unique identifier for the guild (server).                                              |
| guild_name              | The name of the guild.                                                                         |
| total_message_count     | The total number of messages sent across all channels in the guild.                          |

---

**payments table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| payment_id              | The unique identifier for the payment record.                                               |
| payment_date            | The date the payment was made in 'YYYY-MM-DD' format (e.g., '2023-10-01').                  |
| payment_amount          | The amount of money involved in the payment transaction.                                     |
| payment_currency        | The currency used for the payment (e.g., 'USD', 'EUR').                                     |
| payment_description     | A description of the payment.                                                                 |

---

**voice_sessions table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| channel_id              | The ID of the channel linked to the voice session.                                          |
| guild_id                | The ID of the guild (server) associated with the voice session.                              |
| duration_mins           | The total duration of the voice session in minutes.                                           |
| started_date            | The date and time when the voice session started.                                           |
| ended_date              | The date and time when the voice session ended.                                             |

---

**sessions table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| duration_mins           | The total duration of the session in minutes.                                               |
| started_date            | The date and time when the session started.                                                |
| ended_date              | The date and time when the session ended.                                                  |
| device_os               | The operating system of the device used for the session (e.g., 'Windows', 'iOS').          |

---

**package_data table**
| Column                   | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| package_id              | The unique identifier for the package.                                                       |
| package_version         | The version of the package being processed (e.g., '0.1.0').                                 |
| package_owner_id        | The ID of the user who owns the package.                                                    |
| package_owner_name      | The username of the package owner.                                                           |
| package_owner_display_name | The display name of the package owner.                                                    |
| package_owner_avatar_url | The URL of the package owner's avatar image.                                                |
| package_is_partial      | Indicates if the package is partial (1 for true, 0 for false).                               |

---

This documentation serves to clarify the structure and purpose of each table and its respective attributes within the SQLite database, enhancing understanding for developers who will work with this data.