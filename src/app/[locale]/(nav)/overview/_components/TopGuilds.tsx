"use client";

import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import { useTopGuildsData } from "~/hooks/use-data";

export default function TopGuilds() {
  const data = useTopGuildsData().getData({});

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
