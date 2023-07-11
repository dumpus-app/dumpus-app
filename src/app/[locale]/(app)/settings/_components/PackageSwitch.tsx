"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { useConfigStore } from "~/stores/config";
import { formatDate } from "~/utils/format";

export default function PackageSwitch() {
  const unselectedPackages = useConfigStore(
    (state) => state.computed.unselectedPackages
  );
  const setSelectedID = useConfigStore((state) => state.setSelectedID);

  if (unselectedPackages.length === 0) {
    return null;
  }

  return (
    <Section title="Switch package">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        {unselectedPackages
          .map((e, i) => ({ ...e, rank: i + 1 }))
          .map(({ id, rank, package_owner_name, dateAdded }) => (
            <DetailCard.WithRank
              key={rank}
              rank={rank}
              title={package_owner_name}
              description={`Generated on ${formatDate(dateAdded, {
                hour: false,
                minute: false,
              })}`}
              reverseTexts
              onClick={() => {
                setSelectedID(id);
                location.href = "/";
              }}
              rightIcon={ChevronRightIcon}
            />
          ))}
      </div>
    </Section>
  );
}
