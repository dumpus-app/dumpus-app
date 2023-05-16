"use client";

import ScrollArea from "~/components/ScrollArea";
import Section from "~/components/Section";
import AvatarCard from "~/components/data/AvatarCard";

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
  rank: i + 1,
}));

export default function TopGuilds() {
  return (
    <Section title="Top guilds" href="/top/guilds">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {DATA.map((dm) => (
            <AvatarCard
              key={dm.rank}
              {...dm}
              href={`/top/guilds/details?id=${dm.rank}`}
              image={
                <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950">
                  <div>{dm.name[0]}</div>
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
