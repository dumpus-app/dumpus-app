"use client";

import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import i18next from "i18next";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";

const PACKAGES = [
  {
    username: "Androz",
    date: "2023-05-11T00:00Z",
  },
  {
    username: "Androz",
    date: "2023-01-07T00:00Z",
  },
  {
    username: "Florian Lefebvre",
    date: "2023-02-01T00:00Z",
  },
  {
    username: "JsonLines",
    date: "2023-05-14T00:00Z",
  },
].map((pkg, i) => ({ ...pkg, rank: i + 1 }));

const SELECTED_RANK = 3;

export default function Packages() {
  return (
    <Section title="Your packages">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        {PACKAGES.map(({ rank, username, date }) => {
          const selected = SELECTED_RANK === rank;
          return (
            <DetailCard.WithRank
              key={rank}
              rank={rank}
              title={username}
              description={`Generated on ${new Intl.DateTimeFormat(
                i18next.language,
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              ).format(new Date(date))}`}
              reverseTexts
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (selected) return;
                location.href = "/";
              }}
              rightIcon={selected ? CheckCircleIcon : ChevronRightIcon}
              className={clsx(selected ? "!bg-brand-900 !text-brand-300" : "")}
            />
          );
        })}
      </div>
    </Section>
  );
}
