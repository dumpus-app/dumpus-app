"use client";

import i18next from "i18next";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useNetworkState } from "react-use";
import ProfileHeader from "~/components/ProfileHeader";
import { SimpleIconsDiscord } from "~/components/icons";
import Header from "~/components/layout/Header";
import useDMData from "~/hooks/data/use-dm-data";
import useUserDetails from "~/hooks/use-user-details";
import { avatarURLFallback } from "~/utils/discord";
import DailySentMessages from "./_components/DailySentMessages";
import PageHeader from "./_components/PageHeader";
import Stats from "./_components/Stats";
import NoDataAvailable from "~/components/NoDataAvailable";

export default function Page() {
  const params = useSearchParams()!;
  const id = params.get("id")!;

  const { hasData, user, stats, dailySentMessages } = useDMData({ userID: id });

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

  const data = useUserDetails({ userID: user.dm_user_id });

  const username = user.user_name;
  const displayName = data?.display_name || username;
  const avatarURL = data?.avatar_url || user.user_avatar_url;

  return (
    <>
      <PageHeader title={username} />
      <ProfileHeader
        description={username}
        title={displayName}
        imageSlot={
          <div className="relative h-16 w-16 sm:h-32 sm:w-32">
            <Image
              src={
                avatarURLFallback(avatarURL, user.dm_user_id) + `?size=${size}`
              }
              alt={`${username}'s avatar`}
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
      {hasData ? (
        <>
          <Stats
            messageCount={Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(stats.messagesCount)}
            topHour={stats.topChatHour}
            reactionCount="N/A"
          />
          <DailySentMessages data={dailySentMessages} />
        </>
      ) : (
        <NoDataAvailable />
      )}
    </>
  );
}
