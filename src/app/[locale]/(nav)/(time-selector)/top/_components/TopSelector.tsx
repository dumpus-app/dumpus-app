"use client";

import clsx from "clsx";
import { Link as LinkType } from "~/types";
import Link from "~/components/Link";
import { useI18nPathname } from "~/hooks/use-i18n";
import { useScrolled } from "~/hooks/use-layout";

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

export default function TopSelector() {
  const pathname = useI18nPathname();
  const scrolled = useScrolled();

  return (
    <div
      className={clsx(
        "sticky top-[48px] z-20 mb-auto border-b transition-all",
        scrolled
          ? "border-b-gray-800 bg-gray-900 shadow-xl"
          : "border-b-transparent bg-gray-950"
      )}
    >
      <div className="flex items-center space-x-1 px-1 py-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex w-full flex-col items-center rounded-lg py-1 transition-colors",
              link.active(pathname)
                ? "bg-gray-800 text-brand-300"
                : "text-gray-400 hover:bg-gray-800"
            )}
          >
            <span className="">{link.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
