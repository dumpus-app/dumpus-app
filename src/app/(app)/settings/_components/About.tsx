"use client";

import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { Icon } from "~/types";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { SimpleIconsDiscord, SimpleIconsGithub } from "~/components/icons";
import { BASE_URL, VERSION } from "~/constants";
import useCopy from "../_hooks/use-copy";
import { useTranslation } from "~/i18n/client";

function LeftIcon({ icon: Icon }: { icon: Icon }) {
  return <Icon className="h-8 w-8" />;
}

export default function About() {
  const { t } = useTranslation();
  const copy = useCopy();

  return (
    <Section title={t("settings.about.title")}>
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <DetailCard
          title={VERSION}
          description={t("settings.about.version")}
          onClick={() => copy(VERSION)}
          reverseTexts
          leftSlot={<LeftIcon icon={InformationCircleIcon} />}
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          href={BASE_URL}
          target="_blank"
          title={new URL(BASE_URL).hostname}
          description={t("settings.about.website")}
          reverseTexts
          leftSlot={<LeftIcon icon={GlobeAltIcon} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
        <DetailCard
          href="https://androz2091.fr/discord"
          target="_blank"
          title="Discord"
          description={t("settings.about.community")}
          reverseTexts
          leftSlot={<LeftIcon icon={SimpleIconsDiscord} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
        <DetailCard
          href="https://github.com/dumpus-app/dumpus-app"
          target="_blank"
          title="GitHub"
          description={t("settings.about.contribute")}
          reverseTexts
          leftSlot={<LeftIcon icon={SimpleIconsGithub} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
        <DetailCard
          href="/credits"
          title={t("settings.about.credits")}
          description={t("settings.about.contributors")}
          reverseTexts
          leftSlot={<LeftIcon icon={UserGroupIcon} />}
          rightIcon={ChevronRightIcon}
        />
      </div>
    </Section>
  );
}
