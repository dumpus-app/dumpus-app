"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import type { Guild } from "~/types/sql";

export default function RelatedGuild({ guild }: { guild: Guild }) {
  return (
    <Section title="Related Guild">
      <div className="px-2">
        <DetailCard
          href={`/top/guilds/details?id=${guild.guild_id}`}
          title={guild.guild_name}
          description={
            Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(guild.total_message_count) + " messages sent TODO"
          }
          leftSlot={
            <div className="relative flex aspect-square w-10 items-center justify-center rounded-lg bg-brand-300 text-2xl font-bold uppercase text-gray-950">
              <div>{guild.guild_name[0]}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      </div>
    </Section>
  );
}
