"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";

export default function RelatedGuild() {
  return (
    <Section title="Related Guild">
      <div className="px-2">
        <DetailCard
          href={`/top/guilds/details?id=5`}
          title="AndrozDev"
          description="45k messages sent"
          leftSlot={
            <div className="relative flex aspect-square w-10 items-center justify-center rounded-lg bg-brand-300 text-2xl font-bold uppercase text-gray-950">
              <div>A</div>
            </div>
          }
          rightIcon={ChevronRightIcon}
        />
      </div>
    </Section>
  );
}
