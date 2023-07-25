import { useEffect } from "react";

interface ScrollerOptions {
  orientation: "vertical" | "horizontal";
  scrollSpeed?: number;
  skip?: boolean;
}

export default function useScroller<E extends HTMLElement>(
  ref: React.RefObject<E>,
  options?: ScrollerOptions,
) {
  useEffect(() => {
    // return if skip is true
    if (options?.skip) return;

    // return if ref is null
    const current = ref.current;
    if (!current) return;

    const onMouseWheel = (ev: WheelEvent) => {
      const { orientation, scrollSpeed = 1 } = options ?? {};
      if (ev.deltaX !== 0 && orientation === "horizontal") return;
      if (ev.deltaY !== 0 && orientation === "vertical") return;
      ev.preventDefault();

      switch (orientation) {
        case "vertical":
          current.scrollTop += ev.deltaY * scrollSpeed;
          break;
        case "horizontal":
          current.scrollLeft += ev.deltaY * scrollSpeed;
          break;
        default:
          throw new TypeError("Invalid orientation");
      }
    };

    current.addEventListener("wheel", onMouseWheel);

    return () => current.removeEventListener("wheel", onMouseWheel);
  }, [ref, options]);
}
