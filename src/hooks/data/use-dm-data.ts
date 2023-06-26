"use client";

import type { DmChannelsData } from "~/types/sql";
import { useDataSources } from "./_shared";
import i18next from "i18next";
import useTopDMsData from "~/hooks/data/use-top-dms-data";

export default function useDMData({ userID }: { userID: string }) {
  const { db, resultAsList, start, end } = useDataSources();
  const topDMsData = useTopDMsData().getData({});

  const hasData = !!topDMsData.find((dm) => dm.dm_user_id === userID);

  function getUser() {
    const query = `
    SELECT
        user_name,
        user_avatar_url,
        dm_user_id
    FROM dm_channels_data
    WHERE dm_user_id = '${userID}'
    LIMIT 1;
  `;

    const user = resultAsList<
      Pick<DmChannelsData, "user_name" | "user_avatar_url" | "dm_user_id">
    >(db.exec(query)[0])[0];

    return user;
  }

  function getMessagesCount() {
    if (!hasData) return 0;

    const query = `
    SELECT
        SUM(a.occurence_count) AS message_count
    FROM activity a
    JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
    WHERE a.event_name = 'message_sent'
    AND a.day BETWEEN '${start}' AND '${end}'
    AND d.dm_user_id = '${userID}'
    GROUP BY d.dm_user_id
    LIMIT 1;
  `;

    const { message_count } = resultAsList<{ message_count: number }>(
      db.exec(query)[0]
    )[0];

    return message_count;
  }

  function getTopChatHour() {
    if (!hasData) return "";

    const query = `
    SELECT hour,
      SUM(a.occurence_count) AS message_count
    FROM 
      activity a
    JOIN dm_channels_data d
      ON d.channel_id = a.associated_channel_id
    WHERE event_name = 'message_sent' 
    AND day BETWEEN '${start}' AND '${end}'
    AND d.dm_user_id = '${userID}'
    GROUP BY hour
    ORDER BY occurence_count DESC
    LIMIT 1
    `;

    const { hour, message_count } = resultAsList<{
      hour: number;
      message_count: number;
    }>(db.exec(query)[0])[0];

    return new Intl.DateTimeFormat(i18next.language, {
      hour: "numeric",
    }).format(
      (() => {
        const date = new Date();
        date.setHours(hour);
        return date;
      })()
    );
  }

  return {
    hasData,
    user: getUser(),
    stats: {
      messagesCount: getMessagesCount(),
      topChatHour: getTopChatHour(),
    },
  };
}
