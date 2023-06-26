"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useWidgetAPI from "~/hooks/use-widget-api";
import { iconColor } from "~/utils/discord";

function GuildCard({
  guild,
}: {
  guild: ReturnType<ReturnType<typeof useTopGuildsData>["getData"]>[0];
}) {
  const { getGuild } = useWidgetAPI({});

  const { isSuccess, data } = useQuery({
    queryKey: ["widget", guild.guild_id],
    queryFn: () => getGuild({ id: guild.guild_id }),
    staleTime: Infinity,
  });

  return (
    <AvatarCard
      name={guild.guild_name}
      messages={guild.message_count}
      rank={guild.rank}
      href={`/top/guilds/details?id=${guild.guild_id}`}
      image={
        isSuccess && data.error === undefined ? (
          <div className="relative aspect-square w-full">
            <Image
              src={data.icon_url}
              alt={`${data.name}'s avatar`}
              fill
              className="rounded-lg object-cover object-center"
            />
          </div>
        ) : (
          <div
            className="relative flex aspect-square w-full items-center justify-center rounded-lg text-4xl font-bold uppercase text-gray-950"
            style={{
              backgroundColor: iconColor(guild.guild_id),
            }}
          >
            <div>{guild.guild_name[0]}</div>
          </div>
        )
      }
    />
  );
}

export default function TopGuilds() {
  const data = useTopGuildsData().getData({});

  return (
    <Section title="Top guilds" href="/top/guilds">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {data.map((guild) => (
            <GuildCard key={guild.rank} guild={guild} />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
