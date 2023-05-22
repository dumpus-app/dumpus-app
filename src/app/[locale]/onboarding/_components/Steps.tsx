"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";

const STEPS = ["Explanation", "Obtain your data", "Start the analyze"];

export default function Steps() {
  return (
    <div className="grid w-full grid-cols-1 gap-2">
      {STEPS.map((step, i) => (
        <DetailCard
          key={i}
          href="#"
          onClick={(e) => e.preventDefault()}
          title={step}
          description={`Step ${i + 1}`}
          reverseTexts
          rightIcon={CheckCircleIcon}
        />
      ))}
    </div>
  );
}
