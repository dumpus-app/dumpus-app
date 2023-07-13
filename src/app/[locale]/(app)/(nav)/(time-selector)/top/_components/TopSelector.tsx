"use client";

import clsx from "clsx";
import { useEffect } from "react";
import { useUnmount } from "react-use";
import Link from "~/components/Link";
import { useI18nPathname } from "~/hooks/use-i18n";
import { useScrolled } from "~/hooks/use-layout";
import { useAppStore, DEFAULT_SAFE_AREA_INSET_COLOR } from "~/stores";
import { Link as LinkType } from "~/types";
import { colors } from "../../../../../../../../tailwind.config";

const links = [
  {
    href: "/top/dms",
    name: "DMs",
    active: (str) => str.startsWith("/top/dms"),
  },
  {
    href: "/top/guilds",
    name: "Guilds",
    active: (str) => str.startsWith("/top/guilds"),
  },
  {
    href: "/top/channels",
    name: "Channels",
    active: (str) => str.startsWith("/top/channels"),
  },
] satisfies Omit<LinkType, "icon">[];

export default function TopSelector({
  desktop = false,
}: {
  desktop?: boolean;
}) {
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
