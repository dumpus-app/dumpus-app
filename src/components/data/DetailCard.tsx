"use client";

import clsx from "clsx";
import Link from "../Link";
import { Icon } from "~/types";

export type Props = Omit<
  React.ComponentProps<typeof Link>,
  "children" | "title" | "href"
> & {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  rightIcon?: Icon;
  title: string | JSX.Element;
  description: string;
  reverseTexts?: boolean;
  href?: URL | string;
  disabled?: boolean;
};

export default function DetailCard({
  leftSlot,
  rightSlot,
  rightIcon: RightIcon,
  title,
  description,
  className,
  reverseTexts = false,
  href = "#",
  disabled,
  onClick,
  ...rest
}: Props) {
  const hasHref = href !== "#";
  const interactive = hasHref || onClick !== undefined;
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!hasHref) {
          e.preventDefault();
        }
        onClick?.(e);
      }}
      {...rest}
      className={clsx(
        "flex items-center space-x-2 rounded-lg bg-gray-900 p-2 text-gray-400 transition-colors",
        interactive && !disabled
          ? "cursor-pointer hover:bg-gray-800 hover:text-gray-300"
          : "cursor-default",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {leftSlot && <div className="shrink-0">{leftSlot}</div>}
      <div
        className={clsx(
          "flex flex-1",
          reverseTexts ? "flex-col-reverse" : "flex-col",
        )}
      >
        <div className="line-clamp-1 overflow-hidden text-ellipsis break-all font-semibold text-white">
          {title}
        </div>
        <div className="line-clamp-1 overflow-hidden text-ellipsis break-all text-sm">
          {description}
        </div>
      </div>
      {rightSlot || (RightIcon && <RightIcon className="h-7 w-7 shrink-0" />)}
    </Link>
  );
}

export type WithRankProps = Props & {
  rank: number;
};

function WithRank({ rank, className, ...rest }: WithRankProps) {
  return (
    <div className="flex items-center">
      <div className="flex aspect-square h-full shrink-0 items-center justify-center text-2xl font-bold text-white">
        #{rank}
      </div>
      <DetailCard {...rest} className={clsx("flex-1", className)} />
    </div>
  );
}

DetailCard.WithRank = WithRank;
