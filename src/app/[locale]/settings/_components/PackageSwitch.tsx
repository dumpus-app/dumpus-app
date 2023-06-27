"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { defu } from "defu";
import { useAtom, useAtomValue } from "jotai";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { configAtom, unselectedPackagesAtom } from "~/stores";
import { formatDate } from "~/utils/format";

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
              description={`Generated on ${formatDate(issueDate, {
                hour: false,
                minute: false,
              })}`}
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
