"use client";

import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";

const METHODS = [
  {
    name: "Enter your Discord link",
    href: "/onboarding/access/link",
  },
  {
    name: "Transfer the email",
    href: "/onboarding/access/email",
  },
];

export default function Methods() {
  return (
    <div className="grid w-full grid-cols-1 gap-2">
      {METHODS.map(({ name, href }, i) => (
        <DetailCard
          key={href}
          href={href}
          title={name}
          description={`Method ${i + 1}`}
          reverseTexts
          rightIcon={ChevronRightIcon}
        />
      ))}
    </div>
  );
}
