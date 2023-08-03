"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import useRelatedGuild from "~/hooks/data/use-related-guild";
import { useTranslation } from "~/i18n/client";
import type { Guild } from "~/types/sql";
import { firstCharFromUnicode } from "~/utils";
import { iconColor } from "~/utils/discord";
import { formatNumber } from "~/utils/format";

export default function RelatedGuild({
  guild,
  channelID,
}: {
  guild: Guild;
  channelID: string;
}) {
  const { messagesCount } = useRelatedGuild({ guildID: guild.guild_id });
  const { t } = useTranslation();

  return (
    <Section title={t("relatedGuild")}>
      <div className="px-2">
        <DetailCard
          href={{
            pathname: "/top/guilds/details",
            query: {
              id: guild.guild_id,
              redirect: `/top/channels/details/?id=${channelID}`,
            },
          }}
          title={guild.guild_name}
          description={`${formatNumber(messagesCount)} ${t(
            "stats.messagesSent",
          )}`}
          leftSlot={
            <div
              className="relative flex aspect-square w-10 items-center justify-center rounded-lg text-2xl font-bold uppercase text-gray-950"
              style={{
                backgroundColor: iconColor(guild.guild_id),
              }}
            >
              <div>{firstCharFromUnicode(guild.guild_name)}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      </div>
    </Section>
  );
}
