"use client";

import Header from "~/components/layout/Header";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

export default function PageHeader() {
  return (
    <Header
      title="Stats"
      transparent
      rightSlot={
        <Header.Icon
          href={{
            pathname: "/settings",
            query: { redirect: "/stats" },
          }}
          icon={Cog6ToothIcon}
        />
      }
      className="mb-auto border border-b border-gray-800"
    />
  );
}
