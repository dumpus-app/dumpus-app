"use client";

import { useDataSources } from "~/hooks/data/_shared";

export default function useRelatedGuild({ guildID }: { guildID: string }) {
  const { db, resultAsList, start, end } = useDataSources();

  const query = `
    SELECT
      SUM(a.occurence_count) AS message_count
    FROM guilds
    JOIN activity a
      ON a.associated_guild_id = guilds.guild_id
    WHERE a.event_name = 'message_sent'
    AND a.day BETWEEN '${start}' AND '${end}'
    AND guilds.guild_id = '${guildID}';
  `;
  const { message_count } = resultAsList<{ message_count: number }>(
    db.exec(query)[0]
  )[0];

  return { messagesCount: message_count };
}
