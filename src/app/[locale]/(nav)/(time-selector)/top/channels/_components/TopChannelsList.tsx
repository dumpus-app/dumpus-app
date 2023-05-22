"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";

const DATA = [
  {
    name: "Androz",
    messages: 45_000,
  },
  {
    name: "welkenburg",
    messages: 12_000,
  },
  {
    name: "Skanix",
    messages: 11_000,
  },
  {
    name: "JsonLines",
    messages: 8_000,
  },
  {
    name: "GARY",
    messages: 897,
  },
].map((dm, i) => ({
  ...dm,
  name: `#${dm.name}`,
  rank: i + 1,
}));

export default function TopChannelsList() {
  return (
    <div className="grid gap-2 px-2 py-4">
      {DATA.map((dm) => (
        <DetailCard.WithRank
          key={dm.rank}
          href={`/top/channels/details?id=${dm.rank}`}
          rank={dm.rank}
          title={dm.name}
          description={
            Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(dm.messages) + " messages sent"
          }
          leftSlot={
            <div className="relative flex aspect-square w-10 items-center justify-center rounded-lg bg-brand-300 text-2xl font-bold uppercase text-gray-950">
              <div>{dm.name[1]}</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
