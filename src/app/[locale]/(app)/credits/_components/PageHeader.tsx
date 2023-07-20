"use client";

import Header from "~/components/layout/Header";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function PageHeader() {
  return (
    <Header
      title="Credits"
      transparent
      revealBorderOnScroll
      revealBackgroundOnScroll
      leftSlot={<Header.Icon href="/settings" icon={ChevronLeftIcon} />}
      className="border-b border-gray-800"
    />
  );
}
