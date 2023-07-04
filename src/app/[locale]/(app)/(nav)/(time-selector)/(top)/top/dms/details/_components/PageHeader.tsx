"use client";

import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function PageHeader({
  title,
  discordLink,
}: {
  title: string;
  discordLink: string;
}) {
  return (
    <Header
      title={title}
      revealTitleOnScroll
      revealBorderOnScroll
      leftSlot={<Header.Icon href="/top/dms" icon={ChevronLeftIcon} />}
      rightSlot={
        <Header.Icon
          href={discordLink}
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
        />
      }
    />
  );
}
