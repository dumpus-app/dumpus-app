import { useEffect } from "react";

export default function useHorizontalScroller<E extends HTMLElement>(
  ref: React.RefObject<E>,
  { enabled = true, scrollSpeed = 1 } :{
    enabled?: boolean;
    scrollSpeed?: number;
  }
) {
  useEffect(() => {
    // return if it is disabled
    if (!enabled) return;

    // return if ref is null
    const current = ref.current;
    if (!current) return;

    const onMouseWheel = (event: WheelEvent) => {      
      event.preventDefault();

      current.scrollLeft += event.deltaY * scrollSpeed;
    };

    current.addEventListener("wheel", onMouseWheel);

    return () => current.removeEventListener("wheel", onMouseWheel);
  }, [ref, enabled, scrollSpeed]);
}
