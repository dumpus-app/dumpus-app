"use client";

import { useTimeRangePending } from "./_components/TimeSelector";

/**
 * While a tapped time range is being computed, the page between the top and
 * bottom bars dims, so its numbers read as the previous range's rather than
 * as stuck.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const stale = useTimeRangePending();

  return (
    <div
      data-stale={stale ? "" : undefined}
      className="flex grow flex-col transition-opacity duration-200 data-stale:opacity-60 data-stale:delay-150"
    >
      {children}
    </div>
  );
}
