"use client";

import Header from "~/components/layout/Header";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "~/i18n/client";

export default function PageHeader() {
  const { t } = useTranslation();
  return (
    <Header
      title={t("credits.title")}
      transparent
      revealBorderOnScroll
      revealBackgroundOnScroll
      leftSlot={<Header.Icon href="/settings" icon={ChevronLeftIcon} />}
      className="border-b border-gray-800"
    />
  );
}
