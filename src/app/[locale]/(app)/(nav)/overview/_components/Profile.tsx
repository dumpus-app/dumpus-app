"use client";

import Image from "next/image";
import { useNetworkState } from "react-use";
import Button from "~/components/Button";
import ProfileHeader from "~/components/ProfileHeader";
import useUserData from "~/hooks/data/use-user-data";
import { useAppStore } from "~/stores";

export default function Profile() {
  const userData = useUserData();
  const {
    package_owner_name,
    package_owner_display_name,
    package_owner_avatar_url,
  } = userData;

  const networkState = useNetworkState();
  const setOpen = useAppStore(({ ui }) => ui.setShowSharePopup);

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
    <ProfileHeader
      description={package_owner_name}
      title={package_owner_display_name}
      imageSlot={
        <div className="relative h-24 w-24 sm:h-32 sm:w-32">
          <Image
            src={package_owner_avatar_url + `?size=${size}`}
            alt={`${package_owner_display_name}'s Avatar`}
            fill
            priority
            className="rounded-full object-cover object-center"
          />
        </div>
      }
    >
      <Button
        className="absolute right-2 hidden sm:block"
        onClick={() => setOpen(true)}
      >
        Share
      </Button>
    </ProfileHeader>
  );
}
