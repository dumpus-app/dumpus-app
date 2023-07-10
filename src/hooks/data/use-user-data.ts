"use client";

import { useConfigStore } from "~/stores/config";
import useUserDetails from "../use-user-details";

export default function useUserData() {
  const selectedPackage = useConfigStore(
    (state) => state.computed.selectedPackage
  );

  const data = useUserDetails({
    userID: selectedPackage?.package_owner_id || "",
  });

  return {
    ...selectedPackage,
    package_owner_display_name:
      data?.display_name ||
      (selectedPackage.package_owner_display_name === ""
        ? selectedPackage.package_owner_name
        : selectedPackage.package_owner_display_name),
    package_owner_avatar_url:
      data?.avatar_url ||
      (selectedPackage.package_owner_avatar_url == ""
        ? "https://cdn.discordapp.com/embed/avatars/0.png"
        : selectedPackage.package_owner_avatar_url),
  };
}
