"use client";

import Image from "next/image";
import { useNetworkState } from "react-use";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import { avatarURLFallback } from "~/utils/discord";

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
          {data.map((dm) => (
            <AvatarCard
              key={dm.rank}
              name={dm.user_name}
              messages={dm.message_count}
              rank={dm.rank}
              href={`/top/dms/details?id=${dm.dm_user_id}`}
              image={
                <div className="relative aspect-square w-full">
                  <Image
                    src={
                      avatarURLFallback(dm.user_avatar_url, dm.dm_user_id) +
                      `?size=${size}`
                    }
                    alt={`${dm.user_name}'s avatar`}
                    fill
                    className="rounded-full object-cover object-center"
                  />
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
