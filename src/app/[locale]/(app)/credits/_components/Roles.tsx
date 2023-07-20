"use client";

import {
  BugAntIcon,
  CommandLineIcon,
  FilmIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { Icon } from "~/types";
import Flag from "./Flag";

function LeftIcon({
  icon: Icon,
  className,
}: {
  icon: Icon;
  className?: string;
}) {
  return <Icon className={clsx("h-8 w-8", className)} />;
}

export default function Roles() {
  return (
    <Section title="Roles">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <DetailCard
          title="Bug hunter"
          description="Most important people to provide you with stable app."
          leftSlot={<LeftIcon icon={BugAntIcon} className="text-[#FB7185]" />}
        />
        <DetailCard
          title="Influencer"
          description="These people helped us to spread the word about the app."
          leftSlot={<LeftIcon icon={FilmIcon} className="text-[#FBBF24]" />}
        />
        <DetailCard
          title="Developer"
          description="These people made direct contributions to the app's code."
          leftSlot={
            <LeftIcon icon={CommandLineIcon} className="text-[#818CF8]" />
          }
        />
        <DetailCard
          title="Translator"
          description="These people made the app available worldwide."
          leftSlot={<Flag code="fr" />}
        />
      </div>
    </Section>
  );
}
