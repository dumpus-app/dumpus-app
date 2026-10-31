"use client";

import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import useRedirectParam from "~/hooks/use-redirect-param";

export default function PageHeader({
  title,
  discordLink,
}: {
  title: string;
  /** Left out while the channel's server isn't known yet. */
  discordLink?: string;
}) {
  const href = useRedirectParam("/top/channels");

  return (
    <Header
      title={title}
      revealTitleOnScroll
      revealBorderOnScroll
      leftSlot={<Header.Icon href={href} icon={ChevronLeftIcon} />}
      rightSlot={
        discordLink && (
          <Header.Icon
            href={discordLink}
            target="_blank"
            icon={SimpleIconsDiscord}
          />
        )
      }
    />
  );
}
