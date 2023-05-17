"use client";

import clsx from "clsx";
import { Link as LinkType } from "~/types";
import Link from "../Link";
import { useI18nPathname } from "~/hooks/use-i18n";

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

  return (
    <div className="sticky top-0 mb-auto border-b border-gray-800">
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
