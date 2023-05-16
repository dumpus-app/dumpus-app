"use client";

import i18next from "i18next";
import Link from "../Link";

export type Props = {
  href: string;
  image: React.ReactNode;
  name: string;
  messages: number;
  rank: number;
};

export default function AvatarCard({
  href,
  image,
  name,
  messages,
  rank,
}: Props) {
  return (
    <Link
      href={href}
      className="ml-2 flex w-24 shrink-0 flex-col rounded-lg p-2 transition-colors hover:bg-gray-900"
    >
      {image}
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="text-gray-400">{rank}. </span>
        <span className="font-bold text-white">{name}</span>
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-400">
        {Intl.NumberFormat(i18next.language, {
          notation: "compact",
        }).format(messages)}{" "}
        messages
      </div>
    </Link>
  );
}
