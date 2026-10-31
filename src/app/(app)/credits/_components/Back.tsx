"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useTranslation } from "~/i18n/client";

export default function Back() {
  const { t } = useTranslation();
  return (
    <div className="desktop-container hidden px-4 pt-4 sm:block">
      <Link
        href="/settings"
        className="-ml-2 inline-flex pressable items-center rounded-md p-2 [--press-scale:0.95] hover:bg-gray-800 hover:text-white active:bg-gray-800 active:text-white"
      >
        <ChevronLeftIcon className="mr-2 -ml-1 h-6 w-6" />
        <span>{t("credits.back")}</span>
      </Link>
    </div>
  );
}
