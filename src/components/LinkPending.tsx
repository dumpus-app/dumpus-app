"use client";

import { useLinkStatus } from "next/link";
import { useLayoutEffect } from "react";
import { create } from "zustand";

const usePendingHrefStore = create<{ href: string | null }>(() => ({
  href: null,
}));

/**
 * The `href` of the nav link being opened while its page renders, so a nav
 * bar lights that tab at once instead of when the page is done.
 */
export function usePendingHref() {
  return usePendingHrefStore(({ href }) => href);
}

/**
 * Goes inside a `<Link>`, as `useLinkStatus` requires. Its hidden
 * `[data-pending]` marker is for the link's own `has-[[data-pending]]:`
 * styles. A nav link passes its `href` for `usePendingHref`.
 */
export default function LinkPending({
  href,
  children,
}: {
  href?: string;
  children?: (pending: boolean) => React.ReactNode;
}) {
  const { pending } = useLinkStatus();

  // A layout effect, so a nav bar re-renders with the tab lit before the
  // browser paints the frame that shows this link pending.
  useLayoutEffect(() => {
    if (!pending || href === undefined) return;
    usePendingHrefStore.setState({ href });
    return () => {
      if (usePendingHrefStore.getState().href === href) {
        usePendingHrefStore.setState({ href: null });
      }
    };
  }, [pending, href]);

  return (
    <>
      {pending && <span data-pending="" hidden />}
      {children?.(pending)}
    </>
  );
}
