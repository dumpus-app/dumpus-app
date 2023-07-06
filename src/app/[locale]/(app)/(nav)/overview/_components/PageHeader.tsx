"use client";

import Header from "~/components/layout/Header";
import { Cog6ToothIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { useAtomValue } from "jotai";
import { configAtom } from "~/stores";

export default function PageHeader() {
  const { premium } = useAtomValue(configAtom);

  return (
    <Header
      title="Overview"
      revealTitleOnScroll
      revealBorderOnScroll
      leftSlot={
        <>
          {premium && (
            <div className="ml-2 inline-flex items-center rounded-full bg-gold-300 px-2 py-0.5 text-sm font-medium text-gold-800">
              <SparklesIcon className="-ml-0.5 mr-1 h-3 w-3" />
              <span>Premium</span>
            </div>
          )}
        </>
      }
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
