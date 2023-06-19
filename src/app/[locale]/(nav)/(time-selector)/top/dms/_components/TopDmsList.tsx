"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";
import { useTopDMsData } from "~/hooks/use-data";
import { avatarURLFallback } from "~/utils/discord";

export default function TopDMsList() {
  const data = useTopDMsData();

  return (
    <div className="grid gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8">
      {data.map((dm) => (
        <DetailCard.WithRank
          key={dm.rank}
          href={`/top/dms/details?id=${dm.dm_user_id}`}
          rank={dm.rank}
          title={dm.user_name}
          description={
            Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(dm.message_count) + " messages sent"
          }
          leftSlot={
            <div className="relative aspect-square w-10">
              <Image
                src={avatarURLFallback(dm.user_avatar_url, dm.dm_user_id)}
                alt={`${dm.user_name}'s avatar`}
                fill
                className="rounded-full object-cover object-center"
              />
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
