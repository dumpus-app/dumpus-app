import { useEffect } from "react";

interface ScrollerOptions {
  enabled?: boolean;
  scrollSpeed?: number;
}

export default function useYScroller<E extends HTMLElement>(
  ref: React.RefObject<E>,
  options?: ScrollerOptions,
) {
  useEffect(() => {
    // return if it is disabled
    if (!options?.enabled) return;

    // return if ref is null
    const current = ref.current;
    if (!current) return;

    const onMouseWheel = (ev: WheelEvent) => {
      const { scrollSpeed = 1 } = options ?? {};
      
      ev.preventDefault();

      current.scrollLeft += ev.deltaY * scrollSpeed;
    };

    current.addEventListener("wheel", onMouseWheel);

    return () => current.removeEventListener("wheel", onMouseWheel);
  }, [ref, options]);
}
