"use client";

import clsx from "clsx";
import { timeRanges, useAppStore } from "~/stores";

export default function TimeSelector() {
  const [timeRange, setTimeRange] = useAppStore(({ config }) => [
    config.timeRange,
    config.setTimeRange,
  ]);

  return (
    <div className="border-t border-gray-800 bg-gray-900 sm:border-none sm:bg-transparent">
      <div className="flex items-center space-x-1 px-1 py-1 sm:space-x-0 sm:p-0 md:space-x-1">
        {timeRanges.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => setTimeRange(time)}
            className={clsx(
              "w-full rounded-lg py-1 transition-colors sm:whitespace-nowrap sm:px-4",
              time === timeRange
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
