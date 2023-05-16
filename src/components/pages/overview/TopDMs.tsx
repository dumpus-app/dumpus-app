"use client";

import Image from "next/image";
import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";

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

export default function TopDMs() {
  return (
    <Section title="Top DMs" href="/top/dms">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {DATA.map((dm) => (
            <AvatarCard
              key={dm.rank}
              {...dm}
              href={`/top/dms/details?id=${dm.rank}`}
              image={
                <div className="relative aspect-square w-full">
                  <Image
                    src={dm.image}
                    alt={`${dm.name}'s avatar`}
                    fill
                    className="rounded-full object-cover object-center"
                  />
                </div>
              }
            />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
