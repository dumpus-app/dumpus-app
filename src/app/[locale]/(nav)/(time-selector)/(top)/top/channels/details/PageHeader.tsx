"use client";

import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function PageHeader() {
  return (
    <Header
      leftSlot={<Header.Icon href="/top/channels" icon={ChevronLeftIcon} />}
      rightSlot={
        <Header.Icon
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
        />
      }
      className="mb-auto"
    />
  );
}
