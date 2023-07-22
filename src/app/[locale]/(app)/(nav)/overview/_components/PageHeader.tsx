"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import PremiumBadge from "~/components/PremiumBadge";
import Header from "~/components/layout/Header";
import { useAppStore } from "~/stores";
import { useTranslation } from "~/i18n/client";

export default function PageHeader() {
  const { t } = useTranslation();
  const premium = useAppStore(({ config }) => config.premium);

  return (
    <Header
      title={t("nav.overview")}
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
