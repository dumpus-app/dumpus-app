"use client";

import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopChannelsData from "~/hooks/data/use-top-channels-data";
import { iconColor } from "~/utils/discord";

export default function TopChannels() {
  const data = useTopChannelsData().getData({});

  return (
    <Section title="Top channels" href="/top/channels">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {/* TODO: handle no data */}
          {(data || []).map((channel) => (
            <AvatarCard
              key={channel.rank}
              name={"#" + channel.channel_name}
              messages={channel.message_count}
              rank={channel.rank}
              href={`/top/channels/details?guild_id=${channel.guild_id}&channel_id=${channel.channel_id}`}
              image={
                <div
                  className="relative flex aspect-square w-full items-center justify-center rounded-lg text-4xl font-bold uppercase text-gray-950"
                  style={{
                    backgroundColor: iconColor(
                      channel.guild_id + channel.channel_id
                    ),
                  }}
                >
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
