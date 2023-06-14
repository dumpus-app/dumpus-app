-- SQLite

-- Get the complete DM channels leaderboard

SELECT d.dm_user_id,
    d.user_name,
    d.user_avatar_url,
    COUNT(a.event_name) AS message_count,
    d.channel_id
FROM activity a
JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
WHERE a.event_name = 'message_sent' 
--AND a.day BETWEEN '2021-06-01' AND '2021-06-10'
GROUP BY d.dm_user_id
ORDER BY message_count DESC;
