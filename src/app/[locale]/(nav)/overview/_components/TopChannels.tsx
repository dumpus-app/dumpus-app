"use client";

import { useAtomValue } from "jotai";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useSafeDB from "~/hooks/use-safe-db";
import useSQL from "~/hooks/use-sql";
import { timeRangeDates } from "~/stores/db";
import { GuildChannelsData } from "~/types/sql";

function useData() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();

  const [start, end] = useAtomValue(timeRangeDates);

  const query = `
  SELECT channel_name, channel_id, guild_id,
    SUM(a.occurence_count) AS message_count    
FROM guild_channels_data channels
JOIN activity a ON a.associated_channel_id = channels.channel_id
WHERE a.event_name = 'message_sent'
AND a.day BETWEEN '${start}' AND '${end}'
GROUP BY channel_name
ORDER BY message_count DESC;
  `;

  const data = resultAsList<
    Pick<GuildChannelsData, "channel_name" | "channel_id" | "guild_id"> & {
      message_count: number;
    }
  >(db.exec(query)[0]);

  return data.map((channel, i) => ({
    ...channel,
    rank: i + 1,
  }));
}

export default function TopChannels() {
  const data = useData();

  return (
    <Section title="Top channels" href="/top/channels">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {data.map((channel) => (
            <AvatarCard
              key={channel.rank}
              name={"#" + channel.channel_name}
              messages={channel.message_count}
              rank={channel.rank}
              href={`/top/channels/details?guild_id=${channel.guild_id}&channel_id=${channel.channel_id}`}
              image={
                <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950">
                  <div>{channel.channel_name[0]}</div>
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
