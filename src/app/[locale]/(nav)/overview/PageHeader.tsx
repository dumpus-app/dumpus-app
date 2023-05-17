"use client";

import Header from "~/components/layout/Header";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

export default function PageHeader() {
  return (
    <Header
      rightSlot={
        <Header.Icon
          href={{
            pathname: "/settings",
            query: { redirect: "/overview" },
          }}
          icon={Cog6ToothIcon}
        />
      }
    />
  );
}
