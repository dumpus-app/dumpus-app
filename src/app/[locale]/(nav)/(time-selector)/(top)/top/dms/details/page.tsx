"use client";

import Image from "next/image";
import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "./_components/Stats";
import DailySentMessages from "./_components/DailySentMessages";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { useSearchParams } from "next/navigation";
import { useDataSources } from "~/hooks/use-data";
import type { DmChannelsData } from "~/types/sql";
import { avatarURLFallback } from "~/utils/discord";
import i18next from "i18next";
import { useNetworkState } from "react-use";

// TODO: refactor
function useData(id: string) {
  const { db, resultAsList, start, end } = useDataSources();

  let query = `
    SELECT
      user_name,
      user_avatar_url,
      dm_user_id
    FROM dm_channels_data
    WHERE dm_user_id = '${id}'
    LIMIT 1;
  `;

  const user = resultAsList<
    Pick<DmChannelsData, "user_name" | "user_avatar_url" | "dm_user_id">
  >(db.exec(query)[0])[0];

  query = `
  SELECT
    SUM(a.occurence_count) AS message_count
  FROM activity a
  JOIN dm_channels_data d ON a.associated_channel_id = d.channel_id
  WHERE a.event_name = 'message_sent'
  AND a.day BETWEEN '${start}' AND '${end}'
  AND d.dm_user_id = '${id}'
  GROUP BY d.dm_user_id
  LIMIT 1;
  `;

  const { message_count } = resultAsList<{ message_count: number }>(
    db.exec(query)[0]
  )[0];

  return { user, stats: { message_count } };
}

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { user, stats } = useData(id);

  const networkState = useNetworkState();

  const size = (() => {
    switch (networkState.effectiveType) {
      case "slow-2g":
      case "2g":
        return 512;

      case "3g":
      case "4g":
      default:
        return 2048;
    }
  })();

  return (
    <>
      <PageHeader title={user.user_name} />
      <ProfileHeader
        description="TODO"
        title={user.user_name + stats.message_count}
        imageSlot={
          <div className="relative h-16 w-16 sm:h-32 sm:w-32">
            <Image
              src={
                avatarURLFallback(user.user_avatar_url, user.dm_user_id) +
                `?size=${size}`
              }
              alt="Avatar"
              fill
              priority
              className="rounded-full object-cover object-center"
            />
          </div>
        }
      >
        <Header.Icon
          href={`discord://discord.com/users/${user.dm_user_id}`}
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
          className="absolute right-2 top-4 hidden sm:block"
        />
      </ProfileHeader>
      <Stats
        messageCount={Intl.NumberFormat(i18next.language, {
          notation: "compact",
        }).format(stats.message_count)}
        topHour="5 AM TODO"
        reactionCount="7k TODO"
      />
      <DailySentMessages />
    </>
  );
}
