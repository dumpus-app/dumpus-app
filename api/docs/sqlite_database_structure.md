Note: this documentation was generated automatically from the tasks.py code using an AI. Although we are confident in the reliability of the data displayed here, errors may occur.


**activity table**
| Column                  | Description                                                                                                                                                                                                                           |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| event_name              | The name of the event, values: 'message_sent', 'guild_joined', 'application_command_used', 'add_reaction', 'app_opened', 'email_opened', 'login_successful', 'app_crashed', 'user_avatar_updated', etc.  |
| day                     | The date of the event in the format '%Y-%m-%d'                                                                                                                                                                                        |
| hour                    | The hour of the day this event occurred on                                                                                                                                                                                            |
| occurence_count         | The number of occurrences of this event during the given time interval                                                                                                                                                                |
| associated_channel_id   | The id of the channel related to the event. Only applies to events that happen in a channel                                                                                                                                            |
| associated_guild_id     | The id of the guild related to the event. Only applies to events that happen in a guild                                                                                                                                                |
| associated_user_id      | The id of the user related to the event. Only applies to certain events                                                                                                                                                               |
| extra_field_1           | Extra field used for various purposes depending on the event. For example, for the 'add_reaction' event this field specifies the emoji name.                                                                                           |
| extra_field_2           | Another extra field used for various purposes depending on the event. For example, for the 'add_reaction' event this field specifies whether the emoji is custom ('1' for yes, '0' for no).                                         |


**guild_channels_data table**
| Column                      | Description                                                                |
|-----------------------------|----------------------------------------------------------------------------|
| channel_id                  | The unique identifier of the channel in the guild                          |
| guild_id                    | The unique identifier of the guild                                         |
| channel_name                | The name of the channel                                                     |
| total_message_count         | The total count of the messages in the channel                             |
| total_voice_channel_duration| The total duration of voice chat in the channel                             |

**dm_channels_data table**
| Column                      | Description                                                   |
|-----------------------------|---------------------------------------------------------------|
| channel_id                  | The unique identifier of the direct message channel           |
| dm_user_id                  | The unique identifier of the user in the direct message channel|
| user_name                   | The name of the user                                          |
| display_name                | The display name of the user                                  |
| user_avatar_url             | The avatar url of the user                                    |
| total_message_count         | Total count of the messages in the channel                    |
| total_voice_channel_duration| Total duration of voice chat in the channel                   |
| sentiment_score             | Aggregate sentiment score of all the messages in the channel  |

**guilds table**
| Column              | Description                                |
|---------------------|--------------------------------------------|
| guild_id            | The unique identifier of the guild         |
| guild_name          | The name of the guild                      |
| total_message_count | Total count of the messages in the guild   |

**payments table**
| Column              | Description                                      |
|---------------------|--------------------------------------------------|
| payment_id          | Unique identifier of the payment                 |
| payment_date        | The date of the payment in the format '%Y-%m-%d' |
| payment_amount      | Amount of the payment                            |
| payment_currency    | Currency of the payment                          |
| payment_description | Description of the payment                       |

**voice_sessions table**
| Column        | Description                                      |
|---------------|--------------------------------------------------|
| channel_id    | The unique identifier of the channel             |
| guild_id      | The unique identifier of the guild               |
| duration_mins | Duration of the voice session in minutes         |
| started_date  | The date when the voice session started          |
| ended_date    | The date when the voice session ended            |

**sessions table**
| Column        | Description                    |
|---------------|--------------------------------|
| duration_mins | Duration of the session in mins|
| started_date  | Start date of the session      |
| ended_date    | End date of the session        |
| device_os     | Operating system of the device |

**package_data table**
| Column                | Description                     |
|-----------------------|---------------------------------|
| package_id            | The unique identifier of package|
| package_version       | The version of the package      |
| package_owner_id      | ID of the package owner         |
| package_owner_name    | Name of the package owner       |
| package_owner_display_name | Display Name of the package owner |
| package_owner_avatar_url   | Avatar url of the owner          |
| package_is_partial    | Whether the package is partial  |

Arguments which not used as the column on a table in the SQL query is **analytics_line_count** and **is_partial**.