"use client";

import type {
  Activity,
  DmChannelsData,
  Guild,
  GuildChannelsData,
} from "~/types/sql";
import { carriesEvent } from "./_availability";
import { groupDays } from "./_chart";
import { topLocalHour, type DayHourCount } from "./_hours";
import { useDataSources } from "./_shared";
import { SQL_DEFAULT_LIMIT } from "~/constants";

export default function useGuildData({ guildID }: { guildID: string }) {
  const { sql, start, end } = useDataSources();

  // Whether the guild is in the range's top guilds: a message in it.
  const hasData = !!sql.rows`
    SELECT 1 AS found
    FROM activity a
    JOIN guilds g ON g.guild_id = a.associated_guild_id
    WHERE a.event_name = 'message_sent'
    AND a.associated_guild_id = '${guildID}'
    AND a.day BETWEEN '${start}' AND '${end}'
    LIMIT 1;
  `.data?.length;

  function getGuild() {
    const { data, hasError } = sql<Guild>`
    SELECT
      guild_name,
      guild_id,
      total_message_count
    FROM guilds
    WHERE guild_id = '${guildID}'
    LIMIT 1;
  `;

    return hasError ? null : data[0];
  }

  function getMessagesCount() {
    // TODO: implement query
    const { data, hasError } = sql<{ message_count: number }>`
    SELECT SUM(occurence_count) AS message_count
    FROM activity
    WHERE event_name = 'message_sent'
    AND associated_guild_id = '${guildID}'
    AND day BETWEEN '${start}' AND '${end}';
    `;

    return hasError ? null : data[0].message_count;
  }

  function getInvitesCount() {
    // TODO: implement query
    const { data, hasError } = sql<{ invite_count: number }>``;

    return hasError ? null : data[0].invite_count;
  }

  function getJoinsCount() {
    const { data, hasError } = sql<{ join_count: number }>`
    SELECT IFNULL(SUM(occurence_count), 0) AS join_count
    FROM activity
    WHERE event_name = 'guild_joined'
    AND associated_guild_id = '${guildID}'
    AND day BETWEEN '${start}' AND '${end}';
    `;

    return hasError ? null : data[0].join_count;
  }

  /** On the device's clock, see `localHours`. */
  function getTopChatHour() {
    const { data } = sql<DayHourCount>`
      SELECT day, hour, SUM(occurence_count) AS count
      FROM activity
      WHERE event_name = 'message_sent'
      AND associated_guild_id = '${guildID}'
      AND day BETWEEN '${start}' AND '${end}'
      GROUP BY day, hour;
    `;

    return topLocalHour(data);
  }

  /** Null when the export can't tell, see `carriesEvent`. */
  function getTopBots() {
    if (!carriesEvent(sql, "application_command_used")) return null;

    const { data, hasError } = sql.rows<
      Pick<DmChannelsData, "user_name" | "display_name" | "user_avatar_url"> &
        Required<Pick<Activity, "associated_user_id">> & {
          total_occurences: number;
        }
    >`
      SELECT 
          SUM(a.occurence_count) AS total_occurences,
          a.associated_user_id,
          d.user_name,
          d.display_name,
          d.user_avatar_url
      FROM activity a
      LEFT JOIN dm_channels_data d
          ON a.associated_user_id = d.dm_user_id
      WHERE a.event_name = 'application_command_used'
      AND a.associated_guild_id = '${guildID}'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY a.associated_user_id
      ORDER BY total_occurences DESC;
    `;

    return hasError ? null : data;
  }

  function getTopChannels() {
    const { data, hasError } = sql<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
        Pick<Guild, "guild_name"> & {
          message_count: number;
        }
    >`
      SELECT
        channel_name,
        channel_id,
        c.guild_id,
        g.guild_name,
        SUM(a.occurence_count) AS message_count    
      FROM guild_channels_data c
      JOIN activity a
        ON a.associated_channel_id = c.channel_id
      JOIN guilds g
        ON g.guild_id = c.guild_id
      WHERE a.event_name = 'message_sent'
      AND a.day BETWEEN '${start}' AND '${end}'
      AND a.associated_guild_id = '${guildID}'
      GROUP BY channel_id
      ORDER BY message_count DESC
      LIMIT ${SQL_DEFAULT_LIMIT};
  `;

    if (hasError) {
      return null;
    }

    return data.map((channel, i) => ({
      ...channel,
      rank: i + 1,
    }));
  }

  function getDailySentMessages() {
    const { data, hasError } = sql.rows<{ day: string; count: number }>`
      SELECT a.day, SUM(a.occurence_count) AS count
      FROM activity a
      WHERE a.event_name = 'message_sent'
      AND a.associated_guild_id = '${guildID}'
      AND a.day BETWEEN '${start}' AND '${end}'
      GROUP BY a.day;
    `;

    if (hasError) {
      return null;
    }

    return groupDays(start, end, data);
  }

  return {
    hasData,
    guild: getGuild(),
    stats: {
      messagesCount: getMessagesCount(),
      invitesCount: getInvitesCount(),
      joinsCount: getJoinsCount(),
      topChatHour: getTopChatHour(),
    },
    topBots: getTopBots(),
    topChannels: getTopChannels(),
    dailySentMessages: getDailySentMessages(),
  };
}
