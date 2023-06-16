"use client";

import { useAtomValue } from "jotai";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useSafeDB from "~/hooks/use-safe-db";
import useSQL from "~/hooks/use-sql";
import { timeRangeDates } from "~/stores/db";
import { Guild } from "~/types/sql";

function useData() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  const query = `
SELECT guild_name,
    guild_id,
    SUM(a.occurence_count) AS message_count
FROM guilds
JOIN activity a ON a.associated_guild_id = guilds.guild_id
WHERE a.event_name = 'message_sent'
AND a.day BETWEEN '${start}' AND '${end}'
GROUP BY guild_name
ORDER BY message_count DESC;
  `;

  const data = resultAsList<
    Pick<Guild, "guild_name" | "guild_id"> & { message_count: number }
  >(db.exec(query)[0]);

  return data.map((guild, i) => ({
    ...guild,
    rank: i + 1,
  }));
}

export default function TopGuilds() {
  const data = useData();

  return (
    <Section title="Top guilds" href="/top/guilds">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {data.map((guild) => (
            <AvatarCard
              key={guild.rank}
              name={guild.guild_name}
              messages={guild.message_count}
              rank={guild.rank}
              href={`/top/guilds/details?id=${guild.guild_id}`}
              image={
                <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950">
                  <div>{guild.guild_name[0]}</div>
                </div>
              }
            />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
