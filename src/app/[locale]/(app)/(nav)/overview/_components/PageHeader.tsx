"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import PremiumBadge from "~/components/PremiumBadge";
import Header from "~/components/layout/Header";
import { useConfigStore } from "~/stores/config";

export default function PageHeader() {
  const premium = useConfigStore((state) => state.premium);

  return (
    <Header
      title="Overview"
      revealTitleOnScroll
      revealBorderOnScroll
      leftSlot={<>{premium && <PremiumBadge className="ml-2" />}</>}
      rightSlot={
        <Header.Icon
          href={{
            pathname: "/settings",
            query: { redirect: "/overview" },
          }}
          icon={Cog6ToothIcon}
        />
      }
    />
  );
}
