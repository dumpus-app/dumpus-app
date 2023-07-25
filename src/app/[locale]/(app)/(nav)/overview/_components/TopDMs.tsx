"use client";

import { useNetworkState } from "react-use";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useUserDetails from "~/hooks/use-user-details";
import { avatarURLFallback } from "~/utils/discord";
import { useTranslation } from "~/i18n/client";
import DiscordImage from "~/components/DiscordImage";
import { useRef } from "react";
import useScroller from "~/hooks/use-scroller";

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
          <DiscordImage
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
  const { t } = useTranslation();

  const data = useTopDMsData().getData({});
  const networkState = useNetworkState();
  const cardsRef = useRef<HTMLDivElement>(null);

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

  useScroller(cardsRef, {
    orientation: "horizontal",
  });

  return (
    <Section title={t("mostActiveDMs")} href="/top/dms">
      <ScrollArea orientation="horizontal" ref={cardsRef}>
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
