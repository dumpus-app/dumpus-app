"use client";

import clsx from "clsx";
import { Link as LinkType } from "~/types";
import Link from "~/components/Link";
import { useI18nPathname } from "~/hooks/use-i18n";
import { useScrolled } from "~/hooks/use-layout";
import { useSetAtom } from "jotai";
import {
  DEFAULT_SAFE_AREA_INSET_COLOR,
  safeAreaTopColorAtom,
} from "~/stores/ui";
import { useUnmount } from "react-use";
import { useEffect } from "react";
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
  const setSafeAreaTopColor = useSetAtom(safeAreaTopColorAtom);

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
