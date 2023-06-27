"use client";

import type { Activity, DmChannelsData, Guild } from "~/types/sql";
import { useDataSources } from "./_shared";
import useTopGuildsData from "./use-top-guilds-data";

export default function useGuildData({ guildID }: { guildID: string }) {
  const { db, resultAsList, start, end } = useDataSources();
  const topChannelsData = useTopGuildsData().getData({ offset: false });

  const hasData = !!topChannelsData.find((guild) => guild.guild_id === guildID);

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
  };
}
