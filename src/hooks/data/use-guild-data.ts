"use client";

import type {
  Activity,
  DmChannelsData,
  Guild,
  GuildChannelsData,
} from "~/types/sql";
import { useDataSources } from "./_shared";
import useTopGuildsData from "./use-top-guilds-data";
import { SQL_DEFAULT_LIMIT } from "~/constants";

export default function useGuildData({ guildID }: { guildID: string }) {
  const { db, resultAsList, start, end } = useDataSources();
  const topChannelsData = useTopGuildsData().getData({ offset: false });

  const hasData = !!topChannelsData?.find(
    (guild) => guild.guild_id === guildID
  );

  function getGuild() {
    const query = `
    SELECT
      guild_name,
      guild_id,
      total_message_count
    FROM guilds
    WHERE guild_id = '${guildID}'
    LIMIT 1;
  `;

    const guild = resultAsList<Guild>(db.exec(query)[0])[0];

    return guild;
  }

  function getMessagesCount() {
    return null;

    // TODO: implement query
    // const query = `
    // `;

    // const { invite_count } = resultAsList<{ invite_count: number }>(db.exec(query)[0])[0]

    // return invite_count
  }

  function getInvitesCount() {
    return null;

    // TODO: implement query
    // const query = `
    // `;

    // const { invite_count } = resultAsList<{ invite_count: number }>(db.exec(query)[0])[0]

    // return invite_count
  }

  function getJoinsCount() {
    return null;

    // TODO: implement query
    // const query = `
    // `;

    // const { invite_count } = resultAsList<{ invite_count: number }>(db.exec(query)[0])[0]

    // return invite_count
  }

  function getTopChatHour() {
    return null;

    // TODO: implement query
    // const query = `
    // `;

    // const { invite_count } = resultAsList<{ invite_count: number }>(db.exec(query)[0])[0]

    // return invite_count
  }

  function getTopBots() {
    const query = `
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

    const data = resultAsList<
      Pick<DmChannelsData, "user_name" | "display_name" | "user_avatar_url"> &
        Required<Pick<Activity, "associated_user_id">> & {
          total_occurences: number;
        }
    >(db.exec(query)[0]);

    return data;
  }

  function getTopChannels() {
    const query = `
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

    const data = resultAsList<
      Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> &
        Pick<Guild, "guild_name"> & {
          message_count: number;
        }
    >(db.exec(query)[0]).map((channel, i) => ({
      ...channel,
      rank: i + 1,
    }));

    return data;
  }

  function getDailySentMessages() {
    return null;

    // TODO: implement query
    // const query = `
    // `;

    // const { invite_count } = resultAsList<{ invite_count: number }>(db.exec(query)[0])[0]

    // return invite_count
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
