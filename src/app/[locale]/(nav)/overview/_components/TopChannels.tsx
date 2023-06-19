"use client";

import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import { useTopChannelsData } from "~/hooks/use-data";

export default function TopChannels() {
  const data = useTopChannelsData();

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
