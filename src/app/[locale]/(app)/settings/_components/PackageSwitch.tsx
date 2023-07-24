"use client";

import { useTranslation } from "~/i18n/client";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { useAppStore } from "~/stores";
import { formatDate } from "~/utils/format";
import { shallow } from "zustand/shallow";
import { useRouter } from "next/navigation";
import i18next from "i18next";

export default function PackageSwitch() {
  const { t } = useTranslation();
  const router = useRouter();
  const [setSelectedID, selectedID, packages] = useAppStore(
    ({ config }) => [config.setSelectedID, config.selectedID, config.packages],
    shallow
  );
  const getUnselectedPackages = useAppStore(
    ({ config }) => config.getUnselectedPackages
  );
  const unselectedPackages = getUnselectedPackages(packages, selectedID);

  if (unselectedPackages.length === 0) {
    return null;
  }

  return (
    <Section title={t("settings.packageSwitch.title")}>
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        {unselectedPackages
          .map((e, i) => ({ ...e, rank: i + 1 }))
          .map(({ id, rank, package_owner_name, dateAdded }) => (
            <DetailCard.WithRank
              key={rank}
              rank={rank}
              title={package_owner_name}
              description={t("settings.packageSwitch.description", {
                date: formatDate(dateAdded, {
                  hour: false,
                  minute: false,
                }),
              })}
              reverseTexts
              onClick={() => {
                setSelectedID(id);
                router.push(`/${i18next.language}/overview`);
              }}
              rightIcon={ChevronRightIcon}
            />
          ))}
      </div>
    </Section>
  );
}
