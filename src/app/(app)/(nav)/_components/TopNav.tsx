"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import LinkPending, { usePendingHref } from "~/components/LinkPending";
import PendingBar from "~/components/PendingBar";
import PremiumBadge from "~/components/PremiumBadge";
import Header from "~/components/layout/Header";
import { links } from "~/constants";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";
import TopSelector from "../top/_components/TopSelector";
import TimeSelector, { useTimeRangePending } from "./TimeSelector";
import BuyPremium from "~/components/BuyPremium";

export default function TopNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const pendingHref = usePendingHref();
  const rangePending = useTimeRangePending();
  const litLink =
    links.find((link) => link.href === pendingHref) ??
    links.find((link) => link.active(pathname));
  const [premium, backLink] = useAppStore(
    useShallow(({ config, ui }) => [config.premium, ui.redirectParam]),
  );

  const showBack = pathname.includes("/details/");
  const showTopLinks = pathname.startsWith("/top") && !showBack;
  const showSubNav =
    !pathname.startsWith("/settings") && !pathname.startsWith("/credits");

  return (
    <div className="hidden sm:contents">
      <div className="sticky top-safe-area-top-inset z-20">
        <PendingBar
          active={pendingHref !== null || rangePending}
          className="bottom-0"
        />
        <div className="flex h-16 items-center border-b border-gray-800 bg-gray-900">
          <div className="desktop-container flex items-center justify-between px-2">
            <Link
              href="/overview"
              className="flex items-center space-x-2 rounded-full transition-opacity active:opacity-80"
            >
              <div className="relative h-10 w-10">
                <Image
                  src="/assets/logo.png"
                  alt="Dumpus"
                  fill
                  priority
                  className="rounded-full object-cover object-center"
                />
              </div>
              <span className="relative text-2xl font-bold text-white uppercase">
                Dumpus
                {premium && (
                  <PremiumBadge
                    text={t("premium.premium")}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-gray-900 text-xs capitalize"
                  />
                )}
                <BuyPremium className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-gray-900 text-xs whitespace-nowrap" />
              </span>
            </Link>
            <div className="flex items-center space-x-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex w-full pressable items-center rounded-lg px-4 py-2 [--press-scale:0.96]",
                    link === litLink
                      ? "bg-gray-800 text-brand-300"
                      : "text-gray-400 hover:bg-gray-800 active:bg-gray-800",
                  )}
                >
                  <link.icon className="mr-1 -ml-1 h-6 w-6" />
                  <span className="">
                    {t(
                      `nav.${
                        link.name as "overview" | "stats" | "top" | "settings"
                      }`,
                    )}
                  </span>
                  <LinkPending href={link.href} />
                </Link>
              ))}
            </div>
          </div>
        </div>
        {showSubNav && (
          <div className="flex h-12 items-center border-b border-gray-800 bg-gray-900">
            <div
              className={clsx(
                "desktop-container flex items-center px-2",
                !showBack && !showTopLinks
                  ? "justify-center"
                  : "justify-between",
              )}
            >
              {showBack && (
                <Header.Icon href={backLink} icon={ChevronLeftIcon} />
              )}
              {showTopLinks && <TopSelector desktop={true} />}
              <TimeSelector />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
