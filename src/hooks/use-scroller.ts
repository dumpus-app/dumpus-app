import { useEffect } from "react";

interface ScrollerOptions {
  orientation: "vertical" | "horizontal";
  scrollSpeed?: number;
}

export default function useScroller<E extends HTMLElement>(
  ref: React.RefObject<E>,
  options?: ScrollerOptions,
) {
  useEffect(() => {
    const current = ref.current;
    if (!current) return;

    const onMouseWheel = (ev: WheelEvent) => {
      const { orientation, scrollSpeed = 1 } = options ?? {};
      if (ev.deltaX !== 0 && orientation === "horizontal") return;
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
