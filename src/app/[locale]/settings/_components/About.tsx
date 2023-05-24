"use client";

import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import packageJson from "../../../../../package.json";
import { Icon } from "~/types";
import {
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { SimpleIconsDiscord, SimpleIconsGithub } from "~/components/icons";

const version = packageJson.version;

function LeftIcon({ icon: Icon }: { icon: Icon }) {
  return <Icon className="h-8 w-8" />;
}

export default function About() {
  return (
    <Section title="About">
      <div className="grid grid-cols-1 gap-2 px-2">
        <DetailCard
          href="#"
          onClick={(e) => e.preventDefault()}
          title={`v${version}`}
          description="Version"
          reverseTexts
          leftSlot={<LeftIcon icon={InformationCircleIcon} />}
        />
        <DetailCard
          href="https://dumpus-app.net"
          noI18n
          target="_blank"
          title="dumpus-app.net"
          description="Web application"
          reverseTexts
          leftSlot={<LeftIcon icon={GlobeAltIcon} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
        <DetailCard
          href="https://discord.com"
          noI18n
          target="_blank"
          title="Discord"
          description="Community"
          reverseTexts
          leftSlot={<LeftIcon icon={SimpleIconsDiscord} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
        <DetailCard
          href="https://github.com/dumpus-app/dumpus-app"
          noI18n
          target="_blank"
          title="GitHub"
          description="Contribute"
          reverseTexts
          leftSlot={<LeftIcon icon={SimpleIconsGithub} />}
          rightIcon={ArrowTopRightOnSquareIcon}
        />
      </div>
    </Section>
  );
}
