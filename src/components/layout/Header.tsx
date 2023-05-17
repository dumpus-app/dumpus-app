"use client";

import clsx from "clsx";
import { Icon } from "~/types";
import Link from "../Link";

export type Props = {
  title?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  className?: string;
};

export default function Header({
  title,
  leftSlot,
  rightSlot,
  transparent = false,
  className,
}: Props) {
  return (
    <header
      className={clsx(
        "sticky top-0 z-20 flex h-12 items-center justify-center px-2 py-2",
        transparent ? "" : "bg-gray-900",
        className
      )}
    >
      {leftSlot && <div className="absolute left-2">{leftSlot}</div>}
      {title && <div className="text-xl font-bold text-white">{title}</div>}
      {rightSlot && <div className="absolute right-2">{rightSlot}</div>}
    </header>
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
        "text-gray-400 transition-colors hover:text-gray-300",
        className
      )}
      {...rest}
    >
      <Icon className="h-6 w-6" />
    </Link>
  );
}

Header.Icon = HeaderIcon;
