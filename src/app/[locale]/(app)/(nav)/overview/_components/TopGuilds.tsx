"use client";

import { useQuery } from "@tanstack/react-query";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useWidgetAPI from "~/hooks/use-widget-api";
import { firstCharFromUnicode } from "~/utils";
import { iconColor } from "~/utils/discord";
import { useTranslation } from "~/i18n/client";
import DiscordImage from "~/components/DiscordImage";

function GuildCard({
  guild,
}: {
  guild: NonNullable<
    ReturnType<ReturnType<typeof useTopGuildsData>["getData"]>
  >[0];
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
            <DiscordImage
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
            <div>{firstCharFromUnicode(guild.guild_name)}</div>
          </div>
        )
      }
    />
  );
}

export default function TopGuilds() {
  const { t } = useTranslation();
  const data = useTopGuildsData().getData({});

  return (
    <Section title={t("mostActiveServers")} href="/top/guilds">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {(data || []).map((guild) => (
            <GuildCard key={guild.rank} guild={guild} />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
