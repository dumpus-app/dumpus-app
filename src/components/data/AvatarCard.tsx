"use client";

import type { ComponentProps } from "react";
import Link from "../Link";
import { formatNumber } from "~/utils/format";
import { useTranslation } from "~/i18n/client";

export type Props = {
  href: ComponentProps<typeof Link>["href"];
  image: React.ReactNode;
  name: string;
  messages: number;
  rank: number;
  id?: string;
};

export default function AvatarCard({
  href,
  image,
  name,
  messages,
  rank,
  id,
}: Props) {
  const { t } = useTranslation();
  return (
    <Link
      id={id}
      href={href}
      className="ml-2 flex w-24 shrink-0 flex-col rounded-lg p-2 transition-colors hover:bg-gray-900 sm:w-36"
    >
      {image}
      <div className="overflow-hidden text-ellipsis whitespace-nowrap sm:mt-2 sm:text-xl sm:leading-none">
        <span className="text-gray-400">{rank}. </span>
        <span className="font-bold text-white">{name}</span>
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-400 sm:text-lg">
        {t("stats.messages", {
          value: formatNumber(messages),
        })}
      </div>
    </Link>
  );
}
