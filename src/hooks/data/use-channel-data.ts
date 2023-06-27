"use client";

import i18next from "i18next";
import { useDataSources } from "~/hooks/data/_shared";
import useTopChannelsData from "~/hooks/data/use-top-channels-data";
import type { Guild, GuildChannelsData } from "~/types/sql";

export default function useChannelData({
  guildId,
  channelId,
}: {
  guildId: string;
  channelId: string;
}) {
  const { db, resultAsList, start, end } = useDataSources();
  const topChannelsData = useTopChannelsData().getData({ offset: false });

  const hasData = !!topChannelsData.find(
    (channel) => channel.channel_id === channelId
  );

  function getChannel() {
    const query = `
    SELECT
      channel_name,
      channel_id 
    FROM guild_channels_data
    WHERE channel_id = '${channelId}'
    LIMIT 1;
  `;

    const channel = resultAsList<
      Pick<GuildChannelsData, "channel_name" | "channel_id">
    >(db.exec(query)[0])[0];

    return channel;
  }

  function getGuild() {
    const query = `
    SELECT
      guild_name,
      guild_id,
      total_message_count
    FROM guilds
    WHERE guild_id = '${guildId}'
    LIMIT 1;
  `;

    const guild = resultAsList<Guild>(db.exec(query)[0])[0];

    return guild;
  }

  function getMessagesCount() {
    if (!hasData) return 0;

    const query = `
    SELECT
      SUM(a.occurence_count) AS message_count    
    FROM guild_channels_data c
    JOIN activity a
      ON a.associated_channel_id = c.channel_id
    WHERE a.event_name = 'message_sent'
    AND c.channel_id = '${channelId}'
    AND a.day BETWEEN '${start}' AND '${end}'
    GROUP BY channel_name
    LIMIT 1;
  `;

    const { message_count } = resultAsList<{ message_count: number }>(
      db.exec(query)[0]
    )[0];

    return message_count;
  }

  function getTopChatHour() {
    if (!hasData) return "";

    // TODO: fix
    const query = `
    SELECT
    d.channel_id,
      hour,
      SUM(a.occurence_count) AS message_count
    FROM 
      activity a
    JOIN dm_channels_data d
      ON d.channel_id = a.associated_channel_id
    WHERE event_name = 'message_sent' 
    AND day BETWEEN '${start}' AND '${end}'
    AND d.channel_id = '${channelId}'
    GROUP BY hour
    LIMIT 1
    `;

    const dbResult = db.exec(query);
    if (dbResult.length === 0) return null;

    const { hour } = resultAsList<{
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
    channel: getChannel(),
    guild: getGuild(),
    stats: {
      messagesCount: getMessagesCount(),
      topChatHour: getTopChatHour(),
    },
  };
}
