"use client";

import Header from "~/components/layout/Header";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";

export default function PageHeader() {
  const searchParams = useSearchParams();
  const href = searchParams?.get("redirect") || "/overview";

  return (
    <Header
      title="Settings"
      transparent
      revealBorderOnScroll
      revealBackgroundOnScroll
      leftSlot={<Header.Icon href={href} icon={ChevronLeftIcon} />}
      className="border-b border-gray-800"
    />
  );
}
