"use client";

import clsx from "clsx";
import Link from "../Link";
import { Icon } from "~/types";

export type Props = Omit<React.ComponentProps<typeof Link>, "children"> & {
  leftSlot?: React.ReactNode;
  rightIcon?: Icon;
  title: string;
  description: string;
  reverseTexts?: boolean;
};

export default function DetailCard({
  leftSlot,
  rightIcon: RightIcon,
  title,
  description,
  className,
  reverseTexts = false,
  ...rest
}: Props) {
  return (
    <Link
      {...rest}
      className={clsx(
        "flex items-center space-x-2 rounded-lg bg-gray-900 p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300",
        className
      )}
    >
      {leftSlot && <div className="shrink-0">{leftSlot}</div>}
      <div
        className={clsx(
          "flex flex-1",
          reverseTexts ? "flex-col-reverse" : "flex-col"
        )}
      >
        <div className="line-clamp-1 overflow-hidden text-ellipsis break-all font-semibold text-white">
          {title}
        </div>
        <div className="line-clamp-1 overflow-hidden text-ellipsis break-all text-sm">
          {description}
        </div>
      </div>
      {RightIcon && <RightIcon className="h-7 w-7 shrink-0" />}
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
