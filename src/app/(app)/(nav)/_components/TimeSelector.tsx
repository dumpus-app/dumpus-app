"use client";

import clsx from "clsx";
import { create } from "zustand";
import { afterNextPaint } from "~/components/after-paint";
import { useTranslation } from "~/i18n/client";
import { timeRanges, useAppStore } from "~/stores";
import type { TimeRange } from "~/stores/config";

/**
 * The range just tapped, until the page has rendered it. Shared by the bottom
 * bar's and the top bar's selectors.
 */
const usePendingRangeStore = create<{ range: TimeRange | null }>(() => ({
  range: null,
}));

export function useTimeRangePending() {
  return usePendingRangeStore(({ range }) => range !== null);
}

/**
 * Every data hook reads the range from the store and runs its queries while
 * rendering, so setting it holds the main thread until they all ran. The tap
 * lights its button first; the range is set once that frame is painted.
 */
function selectRange(range: TimeRange) {
  const scheduled = usePendingRangeStore.getState().range !== null;
  usePendingRangeStore.setState({ range });
  // A tap while one is scheduled only changes which range it sets.
  if (scheduled) return;

  afterNextPaint(() => {
    const latest = usePendingRangeStore.getState().range;
    if (latest === null) return;
    // Both in the same render: the new range's numbers and the button's
    // pending state gone.
    useAppStore.getState().config.setTimeRange(latest);
    usePendingRangeStore.setState({ range: null });
  });
}

export default function TimeSelector() {
  const timeRange = useAppStore(({ config }) => config.timeRange);
  const pending = usePendingRangeStore(({ range }) => range);
  const shown = pending ?? timeRange;
  const { t } = useTranslation();

  return (
    <div className="border-t border-gray-800 bg-gray-900 sm:border-none sm:bg-transparent">
      <div className="flex items-center space-x-1 px-1 py-1 sm:space-x-0 sm:p-0 md:space-x-1">
        {timeRanges.map((time) => (
          <button
            key={time}
            type="button"
            data-pending={time === pending ? "" : undefined}
            onClick={() => {
              if (time !== shown) selectRange(time);
            }}
            className={clsx(
              "w-full pressable rounded-lg py-1 [--press-scale:0.94] sm:px-4 sm:whitespace-nowrap",
              time === shown
                ? "bg-gray-800 text-brand-300"
                : "text-gray-400 hover:bg-gray-800 active:bg-gray-800",
            )}
          >
            {t(`timeRanges.${time}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
