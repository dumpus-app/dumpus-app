"use client";

import clsx from "clsx";
import { useState } from "react";

export default function TimeSelector() {
  const times = ["4 weeks", "6 months", "2023", "Lifetime"];
  const [active, setActive] = useState(times[0]);

  return (
    <div className="border-t border-gray-800 bg-gray-900 sm:border-none sm:bg-transparent">
      <div className="flex items-center space-x-1 px-1 py-1 sm:p-0">
        {times.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => setActive(time)}
            className={clsx(
              "w-full rounded-lg py-1 transition-colors sm:whitespace-nowrap sm:px-4",
              time === active
                ? "bg-gray-800 text-brand-300"
                : "text-gray-400 hover:bg-gray-800"
            )}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}
