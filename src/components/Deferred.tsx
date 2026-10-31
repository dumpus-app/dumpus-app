"use client";

import { startTransition, useEffect, useState } from "react";
import { afterNextPaint } from "./after-paint";

/**
 * Renders `fallback` first, then `children` once the fallback is on screen,
 * in a transition. For a page whose queries take seconds: its skeleton shows
 * at once, where the previous page would otherwise stay on screen, frozen,
 * until the queries finish.
 */
export default function Deferred({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(
    () => afterNextPaint(() => startTransition(() => setReady(true))),
    [],
  );

  return ready ? children : fallback;
}
