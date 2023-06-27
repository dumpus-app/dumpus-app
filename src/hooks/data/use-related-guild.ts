"use client";

import { useDataSources } from "~/hooks/data/_shared";

export default function useRelatedGuild({ guildID }: { guildID: string }) {
  const { sql, start, end } = useDataSources();

  const { data, hasError } = sql<{ message_count: number }>`
    SELECT
      SUM(a.occurence_count) AS message_count
    FROM guilds
    JOIN activity a
      ON a.associated_guild_id = guilds.guild_id
    WHERE a.event_name = 'message_sent'
    AND a.day BETWEEN '${start}' AND '${end}'
    AND guilds.guild_id = '${guildID}';
  `;

  return { messagesCount: hasError ? null : data[0].message_count };
}
