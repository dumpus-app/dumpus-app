"use client";

import Image from "next/image";
import { useNetworkState } from "react-use";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useUserDetails from "~/hooks/use-user-details";
import { avatarURLFallback } from "~/utils/discord";

function DMCard({
  dm,
  size,
}: {
  dm: NonNullable<ReturnType<ReturnType<typeof useTopDMsData>["getData"]>>[0];
  size: number;
}) {
  const data = useUserDetails({ userID: dm.dm_user_id });

  const username = dm.user_name;
  const displayName = data?.display_name || username;
  const avatarURL = data?.avatar_url || dm.user_avatar_url;

  return (
    <AvatarCard
      name={displayName}
      messages={dm.message_count}
      rank={dm.rank}
      href={`/top/dms/details?id=${dm.dm_user_id}`}
      image={
        <div className="relative aspect-square w-full">
          <Image
            src={avatarURLFallback(avatarURL, dm.dm_user_id) + `?size=${size}`}
            alt={`${username}'s avatar`}
            fill
            className="rounded-full object-cover object-center"
          />
        </div>
      }
    />
  );
}

export default function TopDMs() {
  const data = useTopDMsData().getData({});
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
    <Section title="Top DMs" href="/top/dms">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {(data || []).map((dm) => (
            <DMCard key={dm.rank} dm={dm} size={size} />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
