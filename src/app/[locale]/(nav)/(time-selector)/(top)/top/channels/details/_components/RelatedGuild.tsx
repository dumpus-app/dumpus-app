"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import useRelatedGuild from "~/hooks/data/use-related-guild";
import type { Guild } from "~/types/sql";
import { iconColor } from "~/utils/discord";

export default function RelatedGuild({ guild }: { guild: Guild }) {
  const { messagesCount } = useRelatedGuild({ guildID: guild.guild_id });

  return (
    <Section title="Related Guild">
      <div className="px-2">
        <DetailCard
          href={`/top/guilds/details?id=${guild.guild_id}`}
          title={guild.guild_name}
          description={`${
            messagesCount
              ? Intl.NumberFormat(i18next.language, {
                  notation: "compact",
                }).format(messagesCount)
              : "N/A"
          } messages sent`}
          leftSlot={
            <div
              className="relative flex aspect-square w-10 items-center justify-center rounded-lg text-2xl font-bold uppercase text-gray-950"
              style={{
                backgroundColor: iconColor(guild.guild_id),
              }}
            >
              <div>{guild.guild_name[0]}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      </div>
    </Section>
  );
}
