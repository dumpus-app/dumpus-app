"use client";

import Section from "~/components/Section";
import contributorsData from "~/data/contributors.json";
import DetailCard from "~/components/data/DetailCard";
import {
  BugAntIcon,
  CommandLineIcon,
  FilmIcon,
} from "@heroicons/react/24/solid";
import Flag from "./Flag";
import { partitionArray } from "~/utils";
import Image from "next/image";

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

function sortContributors() {
  const contributors: Contributor[] = [];
  let remainingContributors: Contributor[] = contributorsData;

  // Priority contributors
  {
    const [priorityContributors, rest] = partitionArray(
      remainingContributors,
      (c) => c.priority !== undefined
    );
    remainingContributors = rest;

    priorityContributors.sort((a, b) => a.priority! - b.priority!);
    contributors.push(...priorityContributors);
  }

  // Devs
  {
    const [devContributors, rest] = partitionArray(
      remainingContributors,
      (c) => c.developer !== undefined
    );
    remainingContributors = rest;

    devContributors.sort((a, b) => a.developer! - b.developer!);
    contributors.push(...devContributors);
  }

  // Bug hunters
  {
    const [bugContributors, rest] = partitionArray(
      remainingContributors,
      (c) => c.bugs !== undefined
    );
    remainingContributors = rest;

    bugContributors.sort((a, b) => a.bugs! - b.bugs!);
    contributors.push(...bugContributors);
  }

  // Influencers
  {
    const [influencers, rest] = partitionArray(
      remainingContributors,
      (c) => !!c.influencer
    );
    remainingContributors = rest;

    contributors.push(...influencers);
  }

  // Translators
  {
    contributors.push(...remainingContributors);
  }

  return contributors;
}

const contributors = sortContributors();

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
            src={`/assets/contributors/${name}.png`}
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
          {developer > 0 && (
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
