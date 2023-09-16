"use client";

import { useTranslation } from "~/i18n/client";
import Header from "~/components/layout/Header";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import useRedirectParam from "~/hooks/use-redirect-param";

export default function PageHeader() {
  const { t } = useTranslation();
  const href = useRedirectParam("/overview");

  return (
    <Header
      title={t("settings.title")}
      transparent
      revealBorderOnScroll
      revealBackgroundOnScroll
      leftSlot={<Header.Icon href={href} icon={ChevronLeftIcon} />}
      className="border-b border-gray-800"
    />
  );
}
