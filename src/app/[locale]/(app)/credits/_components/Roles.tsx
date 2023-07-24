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
import { useTranslation } from "~/i18n/client";

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
  const { t } = useTranslation();
  return (
    <Section title={t("credits.title")}>
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <DetailCard
          title={t("credits.bugHunter.title")}
          description={t("credits.bugHunter.description")}
          leftSlot={<LeftIcon icon={BugAntIcon} className="text-[#FB7185]" />}
        />
        <DetailCard
          title={t("credits.influencer.title")}
          description={t("credits.influencer.description")}
          leftSlot={<LeftIcon icon={FilmIcon} className="text-[#FBBF24]" />}
        />
        <DetailCard
          title={t("credits.developer.title")}
          description={t("credits.developer.description")}
          leftSlot={
            <LeftIcon icon={CommandLineIcon} className="text-[#818CF8]" />
          }
        />
        <DetailCard
          title={t("credits.translator.title")}
          description={t("credits.translator.description")}
          leftSlot={<Flag code="fr" />}
        />
      </div>
    </Section>
  );
}
