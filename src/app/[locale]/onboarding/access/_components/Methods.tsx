"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { type TypeOptions } from "i18next";
import DetailCard from "~/components/data/DetailCard";
import { useTranslation } from "~/i18n/client";

export default function Methods() {
  const { t } = useTranslation();

  const rawData = t("onboarding.access.methods", { returnObjects: true });
  const methods = (
    Object.keys(
      rawData
    ) as (keyof TypeOptions["resources"]["translation"]["onboarding"]["access"]["methods"])[]
  ).map((key) => {
    return { ...rawData[key], key };
  });

  return (
    <div className="grid w-full grid-cols-1 gap-2">
      {methods.map(({ key, title, href }, i) => (
        <DetailCard
          key={key}
          href={href}
          title={title}
          description={t("onboarding.access.method", { n: i + 1 })}
          reverseTexts
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
