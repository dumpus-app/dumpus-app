"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import LinkPending from "~/components/LinkPending";
import { useTranslation } from "~/i18n/client";
import { formatNumber } from "~/utils/format";

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
      className="ml-2 flex w-24 shrink-0 pressable flex-col rounded-lg p-2 [--press-scale:0.95] hover:bg-gray-900 active:bg-gray-900 has-[[data-pending]]:bg-gray-900 sm:w-36"
    >
      <LinkPending />
      {image}
      <div className="overflow-hidden text-ellipsis whitespace-nowrap sm:mt-2 sm:text-xl sm:leading-none">
        <span className="text-gray-400">{rank}. </span>
        <span className="font-bold text-white">{name}</span>
      </div>
      <div className="overflow-hidden text-sm text-ellipsis whitespace-nowrap text-gray-400 sm:text-lg">
        {t("stats.messages", {
          value: formatNumber(messages),
        })}
      </div>
    </Link>
  );
}
