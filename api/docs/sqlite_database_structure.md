**Table 1: activity**
| event_name | day | hour | occurence_count | associated_channel_id | associated_guild_id |
|------------|-----|------|-----------------|-----------------------|---------------------|
| Message event name, e.g. 'message_sent'| Date in YYYY-MM-DD format | Hour of the day (0-23) | Number of occurrences of the event | ID of the associated channel | ID of the associated guild, if applicable |

**Table 2: dm_channels_data**
| channel_id | dm_user_id | user_name | user_avatar_url | total_message_count | total_voice_channel_duration | sentiment_score |
|------------|------------|-----------|-----------------|--------------------|-------------------------------|-----------------|
| ID of the direct message channel | ID of the user involved in the direct message| Name of the user | URL of the user's avatar | Total number of messages in the direct message channel | Total duration of voice channel activity, set to 0 for DMs | Sentiment score of the direct message channel |

**Table 3: guild_channels_data**
| channel_id | guild_id | channel_name | total_message_count | total_voice_channel_duration |
|------------|----------|--------------|--------------------|-------------------------------|
| ID of the guild channel | ID of the guild | Name of the guild channel | Total number of messages in the guild channel | Total duration of voice channel activity in the guild channel |

**Table 4: guilds**
| guild_id | guild_name | total_message_count |
|----------|------------|--------------------|
| ID of the guild | Name of the guild | Total number of messages in the guild |

**Table 5: payments**
| payment_id | payment_date | payment_amount | payment_currency | payment_description |
|------------|--------------|----------------|------------------|---------------------|
| ID of the payment | Date of the payment in YYYY-MM-DD format | Amount of the payment | Currency of the payment, e.g. 'USD' | Description of the payment |

**Table 6: voice_sessions**
| channel_id | guild_id | duration_mins | started_date | ended_date |
|------------|----------|---------------|--------------|------------|
| ID of the voice channel | ID of the associated guild, if applicable | Duration of the voice session in minutes | Start date and time of the voice session in ISO 8601 format | End date and time of the voice session in ISO 8601 format |