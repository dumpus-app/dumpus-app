"use client";

import Section from "~/components/Section";
import contributorsData from "../../../../../../contributors.json";
import DetailCard from "~/components/data/DetailCard";
import Image from "next/image";
import {
  BugAntIcon,
  CommandLineIcon,
  FilmIcon,
} from "@heroicons/react/24/solid";
import Flag from "./Flag";

type Contributor = {
  avatarUrl: string;
  name: string;
  description?: string;
  bugs?: number;
  translation?: string;
  developer?: number;
  influencer?: boolean;
  priority?: number;
};

// TODO: sort
const contributors: Contributor[] = contributorsData;

function ContributorCard({ contributor }: { contributor: Contributor }) {
  const {
    avatarUrl,
    name,
    description,
    bugs = 0,
    translation,
    developer = 0,
    influencer,
  } = contributor;

  return (
    <DetailCard
      title={name}
      description={
        description ||
        `${
          bugs + developer + (translation ? 1 : 0) + (influencer ? 1 : 0)
        } contributions`
      }
      leftSlot={
        <div className="relative aspect-square w-10">
          <Image
            src={avatarUrl}
            alt={`${name}'s avatar`}
            fill
            className="rounded-full object-cover object-center"
          />
        </div>
      }
      rightSlot={
        <div className="flex items-center space-x-1">
          {bugs > 0 && (
            <div className="relative">
              <BugAntIcon className="-mr-1 h-8 w-8 text-[#FB7185]" />
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FCE7F3] text-sm font-semibold text-gray-950">
                {bugs > 9 ? "9+" : bugs}
              </div>
            </div>
          )}
          {influencer && <FilmIcon className="h-8 w-8 text-[#FBBF24]" />}
          {developer && (
            <div className="relative">
              <CommandLineIcon className="h-8 w-8 text-[#818CF8]" />
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE9FE] text-sm font-semibold text-gray-950">
                {developer > 9 ? "9+" : developer}
              </div>
            </div>
          )}
          {translation && <Flag code={translation} />}
        </div>
      }
    />
  );
}

export default function Contributors() {
  return (
    <Section title="Contributors">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        {contributors.map((contributor, i) => (
          <ContributorCard key={i} contributor={contributor} />
        ))}
      </div>
    </Section>
  );
}
