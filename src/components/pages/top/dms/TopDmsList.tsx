"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";

const DATA = [
  {
    image: "https://cdn.discordapp.com/embed/avatars/0.png",
    name: "Androz",
    messages: 45_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/1.png",
    name: "welkenburg",
    messages: 12_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/2.png",
    name: "Skanix",
    messages: 11_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/3.png",
    name: "JsonLines",
    messages: 8_000,
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/4.png",
    name: "GARY",
    messages: 897,
  },
].map((dm, i) => ({
  ...dm,
  rank: i + 1,
}));

export default function TopDMsList() {
  return (
    <div className="grid gap-2 px-2 py-4">
      {DATA.map((dm) => (
        <DetailCard.WithRank
          key={dm.rank}
          href={`/top/dms/details?id=${dm.rank}`}
          rank={dm.rank}
          title={dm.name}
          description={
            Intl.NumberFormat(i18next.language, {
              notation: "compact",
            }).format(dm.messages) + " messages sent"
          }
          leftSlot={
            <div className="relative aspect-square w-10">
              <Image
                src={dm.image}
                alt={`${dm.name}'s avatar`}
                fill
                className="rounded-full object-cover object-center"
              />
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
