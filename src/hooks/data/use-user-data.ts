"use client";

import { useAtom, useAtomValue } from "jotai";
import { useRef } from "react";
import { configAtom, selectedPackageAtom } from "~/stores";
import useUserDetails from "../use-user-details";

export default function useUserData() {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const [config, setConfig] = useAtom(configAtom);
  const doneRef = useRef(false);

  const data = useUserDetails({ userID: selectedPackage.package_owner_id });

  if (data && !data.errorMessageCode && !doneRef.current) {
    doneRef.current = true;

    const newConfig = structuredClone(config);

    const packageIndex = newConfig.db.packages.findIndex(
      (p) => p.id === selectedPackage.id
    );

    const pkg = newConfig.db.packages.slice()[packageIndex];

    if (data.display_name !== selectedPackage.package_owner_display_name) {
      pkg.package_owner_display_name = data.display_name;
    }
    if (data.avatar_url !== selectedPackage.package_owner_avatar_url) {
      pkg.package_owner_avatar_url = data.avatar_url;
    }

    newConfig.db.packages[packageIndex] = pkg;

    setTimeout(() => setConfig(newConfig));
  }

  return {
    ...selectedPackage,
    package_owner_display_name:
      selectedPackage.package_owner_display_name === ""
        ? selectedPackage.package_owner_name
        : selectedPackage.package_owner_display_name,
    package_owner_avatar_url:
      selectedPackage.package_owner_avatar_url == ""
        ? "https://cdn.discordapp.com/embed/avatars/0.png"
        : selectedPackage.package_owner_avatar_url,
  };
}
