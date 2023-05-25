import Image from "next/image";
import Section from "~/components/Section";
import StatCard from "~/components/data/StatCard";

const DATA = [
  {
    image: "https://cdn.discordapp.com/embed/avatars/0.png",
    name: "ProBot",
    label: "5k commands",
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/1.png",
    name: "Dank Memer",
    label: "3.5k commands",
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/2.png",
    name: "Green-bot",
    label: "800 commands",
  },
  {
    image: "https://cdn.discordapp.com/embed/avatars/3.png",
    name: "SOFI",
    label: "147 commands",
  },
];

export default function TopUsedBots() {
  return (
    <Section title="Top used bots">
      <div className="grid grid-cols-2 gap-2 px-2">
        {DATA.map((stat, i) => (
          <StatCard
            key={i}
            value={
              <div className="flex items-center">
                <div className="relative mr-1 aspect-square w-6 sm:w-8">
                  <Image
                    src={stat.image}
                    alt={`${stat.name}'s avatar`}
                    fill
                    className="rounded-full object-cover object-center"
                  />
                </div>
                <div className="line-clamp-1 overflow-hidden text-ellipsis font-semibold text-white sm:text-2xl">
                  {stat.name}
                </div>
              </div>
            }
            label={
              <div className="text-sm text-gray-400 sm:text-lg">
                {stat.label}
              </div>
            }
          />
        ))}
      </div>
    </Section>
  );
}
