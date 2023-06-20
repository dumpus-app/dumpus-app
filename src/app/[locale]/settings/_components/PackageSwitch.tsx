"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { defu } from "defu";
import i18next from "i18next";
import { useAtom, useAtomValue } from "jotai";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { configAtom, unselectedPackagesAtom } from "~/stores";

export default function PackageSwitch() {
  const unselectedPackages = useAtomValue(unselectedPackagesAtom);
  const [config, setConfig] = useAtom(configAtom);

  if (unselectedPackages.length === 0) {
    return null;
  }

  return (
    <Section title="Switch package">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        {unselectedPackages
          .map((e, i) => ({ ...e, rank: i + 1 }))
          .map(({ id, rank, package_owner_name, issueDate }) => (
            <DetailCard.WithRank
              key={rank}
              rank={rank}
              title={package_owner_name}
              description={`Generated on ${new Intl.DateTimeFormat(
                i18next.language,
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              ).format(new Date(issueDate))}`}
              reverseTexts
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setConfig(defu({ db: { selectedId: id } }, config));
                location.href = "/";
              }}
              rightIcon={ChevronRightIcon}
            />
          ))}
      </div>
    </Section>
  );
}
