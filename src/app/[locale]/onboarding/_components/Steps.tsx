"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";
import { useTranslation } from "~/i18n/client";

export default function Steps() {
  const { t } = useTranslation();
  return (
    <div className="grid w-full grid-cols-1 gap-2">
      {t("onboarding./.steps", { returnObjects: true }).map((step, i) => (
        <DetailCard
          key={i}
          title={step}
          description={t("onboarding./.step", { n: i + 1 })}
          reverseTexts
          rightIcon={CheckCircleIcon}
        />
      ))}
    </div>
  );
}
