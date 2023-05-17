"use client";

import Header from "~/components/layout/Header";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

export default function PageHeader() {
  return (
    <Header
      title="Stats"
      transparent
      revealBorderOnScroll
      revealBackgroundOnScroll
      rightSlot={
        <Header.Icon
          href={{
            pathname: "/settings",
            query: { redirect: "/stats" },
          }}
          icon={Cog6ToothIcon}
        />
      }
      className="mb-auto"
    />
  );
}
