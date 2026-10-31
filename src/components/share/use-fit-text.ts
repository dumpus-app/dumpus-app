"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Shrinks a one-line text from `max` px, 4 px at a time, until it fits its
 * box or reaches `min`. Measures layout sizes, which the preview's
 * `transform: scale()` doesn't change.
 */
export default function useFitText<T extends HTMLElement>(
  text: string,
  { max, min }: { max: number; min: number },
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    function fit() {
      if (!element) return;
      let size = max;
      element.style.fontSize = `${size}px`;
      while (element.scrollWidth > element.clientWidth && size > min) {
        size = Math.max(min, size - 4);
        element.style.fontSize = `${size}px`;
      }
    }

    fit();
    // A width measured with the fallback font is wrong once Rubik loads.
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && fit());
    return () => {
      cancelled = true;
    };
  }, [text, max, min]);

  return ref;
}
