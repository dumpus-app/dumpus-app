"use client";

import clsx from "clsx";
import { useState } from "react";

export default function TimeSelector() {
  const times = ["4 weeks", "6 months", "2023", "Lifetime"];
  const [active, setActive] = useState(times[0]);

  return (
    <div className="sticky bottom-0 border-t border-gray-800 bg-gray-900">
      <div className="flex items-center space-x-1 px-1 py-1">
        {times.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => setActive(time)}
            className={clsx(
              "flex w-full flex-col items-center rounded-lg py-1 transition-colors",
              time === active
                ? "bg-gray-800 text-brand-300"
                : "text-gray-400 hover:bg-gray-800"
            )}
          >
            <span className="">{time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
