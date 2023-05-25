"use client";

import Image from "next/image";
import Link from "~/components/Link";
import type { Link as LinkType } from "~/types";
import { links } from "~/constants";
import clsx from "clsx";
import { useI18nPathname } from "~/hooks/use-i18n";
import TimeSelector from "../(time-selector)/_components/TimeSelector";
import TopSelector from "../(time-selector)/top/_components/TopSelector";
import Header from "~/components/layout/Header";
import { ChevronLeftIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";

const settingsLink: LinkType = {
  name: "Settings",
  href: "/settings",
  active: (str) => str.startsWith("/settings"),
  icon: Cog6ToothIcon,
};

export default function TopNav() {
  const pathname = useI18nPathname();

  const showBack = pathname.includes("/details/");
  const showTopLinks = pathname.startsWith("/top") && !showBack;
  const showSubNav = showBack || showTopLinks || pathname.startsWith("/stats");

  return (
    <div className="hidden sm:contents">
      <div className="sticky top-0 z-20">
        <div className="flex h-16 items-center border-b border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between px-2 desktop-container">
            <Link
              href="/overview"
              className="flex items-center space-x-2 rounded-full"
            >
              <div className="relative h-10 w-10">
                <Image
                  src="https://cdn.discordapp.com/embed/avatars/0.png"
                  alt="Avatar"
                  fill
                  priority
                  className="rounded-full object-cover object-center"
                />
              </div>
              <span className="text-2xl font-bold uppercase text-white">
                Dumpus
              </span>
            </Link>
            <div className="flex items-center space-x-2">
              {[...links, settingsLink].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex w-full items-center rounded-lg px-4 py-2 transition-colors",
                    link.active(pathname)
                      ? "bg-gray-800 text-brand-300"
                      : "text-gray-400 hover:bg-gray-800"
                  )}
                >
                  <link.icon className="-ml-1 mr-1 h-6 w-6" />
                  <span className="">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        {showSubNav && (
          <div className="flex h-12 items-center border-b border-gray-800 bg-gray-900">
            <div
              className={clsx(
                "flex items-center px-2 desktop-container",
                !showBack && !showTopLinks
                  ? "justify-center"
                  : "justify-between"
              )}
            >
              {showBack && (
                <Header.Icon
                  href={`/top/${
                    pathname.includes("/dms/")
                      ? "dms"
                      : pathname.includes("/channels/")
                      ? "channels"
                      : "guilds"
                  }`}
                  icon={ChevronLeftIcon}
                />
              )}
              {showTopLinks && <TopSelector />}
              <TimeSelector />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
