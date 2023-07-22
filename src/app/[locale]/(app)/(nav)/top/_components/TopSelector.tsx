"use client";

import clsx from "clsx";
import { useEffect } from "react";
import { useUnmount } from "react-use";
import Link from "~/components/Link";
import { useI18nPathname } from "~/hooks/use-i18n";
import { useScrolled } from "~/hooks/use-layout";
import { useAppStore, DEFAULT_SAFE_AREA_INSET_COLOR } from "~/stores";
import { Link as LinkType } from "~/types";
import { colors } from "#root/tailwind.config";
import { useTranslation } from "~/i18n/client";

export default function TopSelector({
  desktop = false,
}: {
  desktop?: boolean;
}) {
  const { t } = useTranslation();

  const links = [
    {
      href: "/top/dms",
      name: t("stats.top.dms"),
      active: (str: string) => str.startsWith("/top/dms"),
    },
    {
      href: "/top/guilds",
      name: t("stats.top.guilds"),
      active: (str: string) => str.startsWith("/top/guilds"),
    },
    {
      href: "/top/channels",
      name: t("stats.top.channels"),
      active: (str: string) => str.startsWith("/top/channels"),
    },
  ] as Omit<LinkType, "icon">[];
  const pathname = useI18nPathname();
  const scrolled = useScrolled();
  const setSafeAreaTopColor = useAppStore(({ ui }) => ui.setSafeAreaTopColor);

  useEffect(() => {
    setSafeAreaTopColor(
      scrolled ? colors.gray[900] : DEFAULT_SAFE_AREA_INSET_COLOR
    );
  }, [scrolled, setSafeAreaTopColor]);

  useUnmount(() => {
    setSafeAreaTopColor(DEFAULT_SAFE_AREA_INSET_COLOR);
  });

  return (
    <div
      className={clsx(
        "border-b transition-all",
        desktop
          ? "border-b-transparent"
          : scrolled
          ? "border-b-gray-800"
          : "border-b-transparent"
      )}
    >
      <div className="flex items-center space-x-1 px-1 py-1 sm:space-x-0 sm:p-0 md:space-x-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "w-full rounded-lg py-1 text-center transition-colors sm:px-4",
              link.active(pathname)
                ? "bg-gray-800 text-brand-300"
                : "text-gray-400 hover:bg-gray-800"
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
