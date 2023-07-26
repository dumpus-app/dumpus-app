"use client";

import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import type { Guild, GuildChannelsData } from "~/types/sql";
import { firstCharFromUnicode } from "~/utils";
import { iconColor } from "~/utils/discord";
import { useTranslation } from "~/i18n/client";

type Channel = Pick<
  GuildChannelsData,
  "channel_name" | "channel_id" | "guild_id"
> &
  Pick<Guild, "guild_name"> & {
    message_count: number;
    rank: number;
  };

export default function TopChannels({
  guildID,
  channels,
}: {
  guildID: string;
  channels: Channel[];
}) {
  const { t } = useTranslation();
  return (
    <Section title={t("topChannels")}>
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {channels.map((channel) => (
            <AvatarCard
              key={channel.rank}
              name={"#" + channel.channel_name}
              messages={channel.message_count}
              rank={channel.rank}
              // href={`/top/channels/details?channel_id=${channel.channel_id}`}
              href={{
                pathname: "/top/channels/details",
                query: {
                  id: channel.channel_id,
                  redirect: `/top/guilds/details?id=${guildID}`,
                },
              }}
              image={
                <div
                  className="relative flex aspect-square w-full items-center justify-center rounded-lg text-4xl font-bold uppercase text-gray-950"
                  style={{
                    backgroundColor: iconColor(
                      channel.guild_id + channel.channel_id,
                    ),
                  }}
                >
                  <div>{firstCharFromUnicode(channel.channel_name)}</div>
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
