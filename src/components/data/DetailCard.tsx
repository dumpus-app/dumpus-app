"use client";

import clsx from "clsx";
import Link from "next/link";
import LinkPending from "~/components/LinkPending";
import Spinner from "~/components/Spinner";
import { Icon } from "~/types";

export type Props = Omit<
  React.ComponentProps<typeof Link>,
  "children" | "title" | "href"
> & {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  rightIcon?: Icon;
  title: string | React.JSX.Element;
  description: string;
  reverseTexts?: boolean;
  href?: React.ComponentProps<typeof Link>["href"];
  disabled?: boolean;
  /** What a tap started is running: a spinner takes the right icon's place. */
  pending?: boolean;
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
  pending = false,
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
      aria-busy={pending || undefined}
      {...rest}
      className={clsx(
        "flex items-center space-x-2 rounded-lg p-2 text-gray-400",
        pending ? "bg-gray-800" : "bg-gray-900",
        interactive && !disabled
          ? "pressable cursor-pointer [--press-scale:0.98] hover:bg-gray-800 hover:text-gray-300 active:bg-gray-800 active:text-gray-300 has-[[data-pending]]:bg-gray-800"
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
        <div className="line-clamp-1 overflow-hidden font-semibold break-all text-ellipsis text-white">
          {title}
        </div>
        <div className="line-clamp-1 overflow-hidden text-sm break-all text-ellipsis">
          {description}
        </div>
      </div>
      {rightSlot ||
        (RightIcon && (
          <LinkPending>
            {(navigating) =>
              pending || navigating ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-300">
                  <Spinner />
                </span>
              ) : (
                <RightIcon className="h-7 w-7 shrink-0" />
              )
            }
          </LinkPending>
        ))}
    </Link>
  );
}

export type WithRankProps = Props & {
  rank: number;
};

function WithRank({ rank, className, ...rest }: WithRankProps) {
  return (
    <div className="flex row-enter items-center">
      <div className="flex aspect-square h-full shrink-0 items-center justify-center text-2xl font-bold text-white">
        #{rank}
      </div>
      <DetailCard {...rest} className={clsx("flex-1", className)} />
    </div>
  );
}

DetailCard.WithRank = WithRank;
