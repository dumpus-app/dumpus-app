"use client";

import clsx from "clsx";
import { Icon } from "~/types";
import Link from "../Link";
import { useScrolled } from "~/hooks/use-layout";
import { useSetAtom } from "jotai";
import {
  DEFAULT_SAFE_AREA_INSET_COLOR,
  safeAreaTopColorAtom,
} from "~/stores/ui";
import { useCallback, useEffect } from "react";
import { colors } from "../../../tailwind.config";
import { useMount, useUnmount } from "react-use";

export type Props = {
  title?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  className?: string;
  revealTitleOnScroll?: boolean;
  revealBorderOnScroll?: boolean;
  revealBackgroundOnScroll?: boolean;
  children?: React.ReactNode;
  wrapperClassName?: string;
};

export default function Header({
  title,
  leftSlot,
  rightSlot,
  transparent = false,
  className,
  revealTitleOnScroll = false,
  revealBorderOnScroll = false,
  revealBackgroundOnScroll = false,
  children,
  wrapperClassName,
}: Props) {
  const scrolled = useScrolled();
  const showTitle = revealTitleOnScroll ? scrolled : true;
  const showBorder = revealBorderOnScroll ? scrolled : false;
  const showBackground = revealBackgroundOnScroll ? scrolled : false;
  const setSafeAreaTopColor = useSetAtom(safeAreaTopColorAtom);

  const showLightBackground = useCallback(() => {
    return transparent ? (showBackground ? true : false) : true;
  }, [showBackground, transparent]);

  useMount(() => {
    setSafeAreaTopColor(
      showLightBackground() ? colors.gray[900] : DEFAULT_SAFE_AREA_INSET_COLOR
    );
  });

  useEffect(() => {
    setSafeAreaTopColor(
      showLightBackground() ? colors.gray[900] : DEFAULT_SAFE_AREA_INSET_COLOR
    );
  }, [setSafeAreaTopColor, showLightBackground]);

  useUnmount(() => {
    setSafeAreaTopColor(DEFAULT_SAFE_AREA_INSET_COLOR);
  });

  return (
    <div
      className={clsx(
        "sticky top-safe-area-top-inset z-20 block transition-colors sm:hidden",
        showLightBackground() ? "bg-gray-900" : "bg-gray-950",
        wrapperClassName
      )}
    >
      <header
        className={clsx(
          "flex h-12 items-center justify-center border-b px-2 py-2 transition-colors",

          showBorder ? "border-b-gray-800" : "border-b-transparent",
          className
        )}
      >
        {leftSlot && <div className="absolute left-0">{leftSlot}</div>}
        {title && (
          <div
            className={clsx(
              "text-xl font-bold text-white transition-opacity",
              showTitle ? "opacity-100" : "opacity-0"
            )}
          >
            {title}
          </div>
        )}
        {rightSlot && <div className="absolute right-0">{rightSlot}</div>}
      </header>
      {children}
    </div>
  );
}

export type HeaderIconProps = Omit<
  React.ComponentProps<typeof Link>,
  "children"
> & {
  icon: Icon;
};

function HeaderIcon({ icon: Icon, className, ...rest }: HeaderIconProps) {
  return (
    <Link
      className={clsx(
        "block p-2 text-gray-400 transition-colors hover:text-gray-300",
        className
      )}
      {...rest}
    >
      <Icon className="h-6 w-6" />
    </Link>
  );
}

Header.Icon = HeaderIcon;
