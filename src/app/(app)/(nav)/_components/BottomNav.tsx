"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMeasure, useMount, useUnmount } from "react-use";
import colors from "tailwindcss/colors";
import { shallow } from "zustand/shallow";
import { links as _links } from "~/constants";
import { useTranslation } from "~/i18n/client";
import { DEFAULT_SAFE_AREA_INSET_COLOR, useAppStore } from "~/stores";
import TimeSelector from "./TimeSelector";

const links = _links.filter((link) => !link.desktop);

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const [ref, { height }] = useMeasure<HTMLDivElement>();
  const [setHeight, setSafeAreaBottomColor] = useAppStore(
    ({ ui }) => [ui.setBottomNavHeight, ui.setSafeAreaBottomColor],
    shallow,
  );

  useEffect(() => {
    setHeight(height);
  }, [height, setHeight]);

  useMount(() => {
    setSafeAreaBottomColor(colors.gray[900]);
  });

  useUnmount(() => {
    setHeight(0);
    setSafeAreaBottomColor(DEFAULT_SAFE_AREA_INSET_COLOR);
  });

  return (
    <div className="contents sm:hidden">
      <div className="mt-auto" style={{ height: `${height}px` }} />
      <div
        ref={ref}
        className="fixed bottom-safe-area-bottom-inset left-0 right-0 z-20"
      >
        <TimeSelector />
        <div className="border-t border-gray-800 bg-gray-900">
          <div className="flex items-center space-x-1 px-1 py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex w-full flex-col items-center rounded-lg py-1 transition-colors",
                  link.active(pathname)
                    ? "bg-gray-800 text-brand-300"
                    : "text-gray-400 hover:bg-gray-800",
                )}
              >
                <link.icon className="h-6 w-6" />
                <span className="mt-1">
                  {t(
                    `nav.${
                      link.name as "overview" | "stats" | "top" | "settings"
                    }`,
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
