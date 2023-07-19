"use client";

import { useDataSources } from "./_shared";

export default function useUsageStatsData(forceLifetime?: boolean) {
  const { sql, start, end, startLimit, endLimit } = useDataSources();

  const startDate = forceLifetime ? startLimit : start;
  const endDate = forceLifetime ? endLimit : end;

  function getNetworkSize() {
    const { data, hasError } = sql<{ network_size: number }>`
      SELECT
        COUNT(DISTINCT dm_user_id) as network_size
      FROM dm_channels_data;
    `;

    return hasError ? null : data[0].network_size;
  }

  function getJoinedGuilds() {
    const { data, hasError } = sql<{ join_count: number }>`
      SELECT
        COUNT(DISTINCT(a.associated_guild_id)) as join_count
      FROM activity a
      WHERE a.event_name = 'guild_joined'
      AND a.day BETWEEN '${startDate}' AND '${endDate}';
    `;

    return hasError ? null : data[0].join_count;
  }

  function getTopHour() {
    const { data, hasError } = sql<{
      hour: number;
      message_count: number;
    }>`
      SELECT hour,
        SUM(occurence_count) AS message_count
      FROM 
          activity
      WHERE event_name = 'message_sent' 
          AND day BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY hour
      ORDER BY message_count DESC
      LIMIT 1
    `;

    return hasError ? null : data[0].hour;
  }

  function getSpentMoney() {
    const { data, hasError } = sql<{ total_spent: number }>`
      SELECT
        SUM(payment_amount) / 100 as total_spent
      FROM payments
    `;

    return hasError ? null : data[0].total_spent;
  }

  function getMessageCount() {
    const { data, hasError } = sql<{ message_count: number }>`
      SELECT
        SUM(a.occurence_count) AS message_count    
      FROM activity a
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${startDate}' AND '${endDate}'
    `;

    return hasError ? null : data[0].message_count;
  }

  function getAvgMessageCountPerDay() {
    const { data, hasError } = sql<{ average_daily_occurences: number }>`
      SELECT
        ROUND(AVG(daily_occurences)) AS average_daily_occurences
      FROM (
        SELECT
            day,
            SUM(occurence_count) AS daily_occurences
        FROM 
            activity
        WHERE event_name = 'message_sent' 
        AND day BETWEEN '${startDate}' AND '${endDate}'
        GROUP BY 
            day
      ) AS daily_summary;
    `;

    return hasError ? null : data[0].average_daily_occurences;
  }

  function getAppStarted() {
    const { data, hasError } = sql<{ app_started: number }>`
      SELECT SUM(a.occurence_count) AS app_started
      FROM activity a
      WHERE a.event_name = 'app_opened'
      AND a.day BETWEEN '${startDate}' AND '${endDate}';
    `;

    return hasError ? null : data[0].app_started;
  }

  function getAvgAppStartedPerDay() {
    const { data, hasError } = sql<{ average_daily_occurences: number }>`
      SELECT ROUND(AVG(total_occurence)) as average_daily_occurences
      FROM (
        SELECT day, SUM(occurence_count) as total_occurence 
        FROM activity
        WHERE event_name = 'app_opened'
        GROUP BY day
      ) daily_counts;
    `;

    return hasError ? null : data[0].average_daily_occurences;
  }

  function getAvgSessionDuration() {
    const { data, hasError } = sql<{ average_session_duration: number }>`
      SELECT AVG(duration_mins) as average_session_duration
      FROM sessions
      WHERE started_date BETWEEN '${
        new Date(startDate).getTime() / 1_000
      }' AND '${new Date(endDate).getTime() / 1_000}'
    `;

    return hasError ? null : data[0].average_session_duration || 0;
  }

  function getTotalSessionDuration() {
    const { data, hasError } = sql<{ total_session_duration: number }>`
      SELECT SUM(duration_mins) as total_session_duration
      FROM sessions
      WHERE started_date BETWEEN '${
        new Date(startDate).getTime() / 1_000
      }' AND '${new Date(endDate).getTime() / 1_000}'
    `;

    return hasError ? null : data[0].total_session_duration || 0;
  }

  function getReceivedCalls() {
    const { data, hasError } = sql<{ received_calls: number }>`
      SELECT count(*) as received_calls
      FROM voice_sessions
      WHERE started_date BETWEEN '${
        new Date(startDate).getTime() / 1_000
      }' AND '${new Date(endDate).getTime() / 1_000}';
    `;

    return hasError ? null : data[0].received_calls;
  }

  function getUsePerOS() {
    const { data, hasError } = sql<{ os: string; count: number }>`
      SELECT SUM(duration_mins) / 60 as count, device_os as os
      FROM sessions
      WHERE started_date BETWEEN '${
        new Date(startDate).getTime() / 1_000
      }' AND '${new Date(endDate).getTime() / 1_000}'
      GROUP BY device_os;
    `;

    return hasError ? null : data;
  }

  function countEvent(eventName: string) {
    const { data, hasError } = sql<{ event_count: number }>`
      SELECT SUM(occurence_count) as event_count
      FROM activity
      WHERE event_name = '${eventName}'
      AND day BETWEEN '${startDate}' AND '${endDate}';
    `;
    return hasError ? null : data[0].event_count;
  }

  function getTimeSpentInVoiceChannels() {
    const { data, hasError } = sql<{ time_spent: number }>`
      SELECT SUM(duration_mins) as time_spent
      FROM voice_sessions
      WHERE started_date BETWEEN '${
        new Date(startDate).getTime() / 1_000
      }' AND '${new Date(endDate).getTime() / 1_000}';
    `;
    return hasError ? null : (data[0].time_spent || 0) * 60 * 1000;
  }

  return {
    networkSize: () => getNetworkSize(),
    joinedGuilds: () => getJoinedGuilds(),
    topHour: () => getTopHour(),
    spentMoney: () => getSpentMoney(),
    messageCount: () => getMessageCount(),
    avgMessageCountPerDay: () => getAvgMessageCountPerDay(),
    appStarted: () => getAppStarted(),
    avgAppStartedPerDay: () => getAvgAppStartedPerDay(),
    avgSessionDuration: () => getAvgSessionDuration(),
    totalSessionDuration: () => getTotalSessionDuration(),
    receivedCalls: () => getReceivedCalls(),
    usePerOs: () => getUsePerOS(),
    notificationClicked: () => countEvent("notification_clicked"),
    emailReceived: () => countEvent("email_opened"),
    loginSuccessful: () => countEvent("login_successful"),
    userAvatarUpdated: () => countEvent("user_avatar_updated"),
    appCrashed: () => countEvent("app_crashed"),
    oauth2Authorized: () => countEvent("oauth2_authorize_accepted"),
    voiceMessageRecorded: () => countEvent("voice_message_recorded"),
    messageReported: () => countEvent("message_reported"),
    messageEdited: () => countEvent("message_edited"),
    nitroAds: () => countEvent("premium_upsell_viewed"),
    captchaServed: () => countEvent("captcha_served"),
    timeSpentVoice: () => getTimeSpentInVoiceChannels(),
  };
}
