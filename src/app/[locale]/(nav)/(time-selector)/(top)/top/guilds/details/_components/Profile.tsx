"use client";

import ProfileHeader from "~/components/ProfileHeader";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import type { Guild } from "~/types/sql";
import useWidgetAPI from "~/hooks/use-widget-api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { iconColor } from "~/utils/discord";

export default function Profile({
  guild,
  discordLink,
}: {
  guild: Guild;
  discordLink: string;
}) {
  const { getGuild } = useWidgetAPI({});

  const { isSuccess, data } = useQuery({
    queryKey: ["widget", guild.guild_id],
    queryFn: () => getGuild({ id: guild.guild_id }),
    staleTime: Infinity,
  });

  return (
    <ProfileHeader
      description={
        isSuccess && data.error === undefined
          ? `${data.member_count} members`
          : "N/A members"
      }
      title={guild.guild_name}
      imageSlot={
        isSuccess && data.error === undefined ? (
          <div className="relative aspect-square w-16 sm:w-32">
            <Image
              src={data.icon_url}
              alt={`${data.name}'s avatar`}
              fill
              className="rounded-lg object-cover object-center"
            />
          </div>
        ) : (
          <div
            className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg text-4xl font-bold uppercase text-gray-950 sm:w-32 sm:text-6xl"
            style={{
              backgroundColor: iconColor(guild.guild_id),
            }}
          >
            <div>{guild.guild_name[0]}</div>
          </div>
        )
      }
    >
      <Header.Icon
        href={discordLink}
        target="_blank"
        noI18n
        icon={SimpleIconsDiscord}
        className="absolute right-2 top-4 hidden sm:block"
      />
    </ProfileHeader>
  );
}
