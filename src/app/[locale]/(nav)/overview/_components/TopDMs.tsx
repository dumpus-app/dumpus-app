"use client";

import Image from "next/image";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useSafeDB from "~/hooks/use-safe-db";
import useSQL from "~/hooks/use-sql";
import type { DmChannelsData } from "~/types/sql";
import { avatarURLFallback } from "~/utils/discord";

const DATA = [
  {
    image: "https://cdn.discordapp.com/embed/avatars/0.png",
    name: "Androz",
    messages: 45_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/1.png",
    name: "welkenburg",
    messages: 12_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/2.png",
    name: "Skanix",
    messages: 11_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/3.png",
    name: "JsonLines",
    messages: 8_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/4.png",
    name: "GARY",
    messages: 897,
  },
].map((dm, i) => ({
  ...dm,
  rank: i + 1,
}));

function useData() {
  const db = useSafeDB();
  const { resultAsList } = useSQL();
  const query = `
  SELECT d.dm_user_id,
    d.user_name,
    d.user_avatar_url,
    SUM(a.occurence_count) AS message_count,
    d.channel_id
  FROM activity a
  JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
  WHERE a.event_name = 'message_sent'
  AND a.day BETWEEN '2023-01-15' AND '2023-06-15'
  GROUP BY d.dm_user_id
  ORDER BY message_count DESC;
  `;

  const data = resultAsList<
    Pick<
      DmChannelsData,
      "dm_user_id" | "user_name" | "user_avatar_url" | "channel_id"
    > & { message_count: number }
  >(db.exec(query)[0]);

  return data?.map((dm, i) => ({
    ...dm,
    rank: i + 1,
  }));
}

export default function TopDMs() {
  const data = useData();

  return (
    <Section title="Top DMs" href="/top/dms">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {data.map((dm) => (
            <AvatarCard
              key={dm.rank}
              name={dm.user_name}
              messages={dm.message_count}
              rank={dm.rank}
              href={`/top/dms/details?id=${dm.dm_user_id}`}
              image={
                <div className="relative aspect-square w-full">
                  <Image
                    src={avatarURLFallback(dm.user_avatar_url, dm.dm_user_id)}
                    alt={`${dm.user_name}'s avatar`}
                    fill
                    className="rounded-full object-cover object-center"
                  />
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
