**Table 1: activity**
| event_name | day | hour | occurence_count | associated_channel_id | associated_guild_id |
|-----------|----|----|----------------|---------------------|------------------|
|Represents the event type, such as "message_sent"|Date when the event occurred, in the format 'Y-m-d'|Hour when the event occurred, as an integer|Number of times the event occurred|ID of the associated direct message or guild channel|ID of the associated guild, if applicable|

**Table 2: dm_channels_data**
| channel_id | dm_user_id | user_name | user_avatar_url | total_message_count | total_voice_channel_duration | sentiment_score |
|----------|---------|----------|--------------|------------------|-------------------------|-------------|
|ID of the direct message channel|ID of the direct message user|Name of the direct message user|Avatar URL of the direct message user|Total number of messages sent in the DM channel|Total duration spent in voice channels, as an integer|Sentiment score associated with messages sent|

**Table 3: guild_channels_data**
| channel_id | guild_id | channel_name | total_message_count | total_voice_channel_duration |
|----------|-------|------------|------------------|-------------------------|
|ID of the guild channel|ID of the associated guild|Name of the guild channel|Total number of messages sent in the guild channel|Total duration spent in voice channels, as an integer|

**Table 4: guilds**
| guild_id | guild_name | total_message_count |
|-------|----------|------------------|
|ID of the guild|Name of the guild|Total number of messages sent across all channels within the guild|

**Table 5: payments**
| payment_id | payment_date | payment_amount | payment_currency | payment_description |
|---------|-----------|-------------|--------------|-----------------|
|Unique identifier of the payment|Date when the payment occurred, in the format 'Y-m-d'|Amount of the payment paid|Currency used for the payment|A short description of the payment|

**Table 6: voice_sessions**
| channel_id | guild_id | duration_mins | started_date | ended_date |
|----------|-------|------------|-----------|---------|
|ID of the direct message or guild channel|ID of the associated guild, if applicable|Total duration(minutes) of the voice session|Date and time when the voice session started, in the format 'Y-m-d H:M:S'| Date and time when the voice session ended, in the format 'Y-m-d H:M:S'|