"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useWindowScroll } from "react-use";
import { create } from "zustand";
import { shallow } from "zustand/shallow";

const useStore = create<{
  y: number;
  setY: (v: number) => void;
}>((set) => ({
  y: 0,
  setY: (y) => set((state) => ({ y })),
}));

export function useScrolled() {
  const [y, setY] = useStore((state) => [state.y, state.setY], shallow);
  const scroll = useWindowScroll();

  useEffect(() => {
    setY(scroll.y);
  }, [scroll, setY]);

  return y > 120;
}

export function useScrollTop() {
  const setY = useStore((state) => state.setY);
  const pathname = usePathname();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.hash) {
      window.document.scrollingElement?.scrollTo({
        left: 0,
        top: 0,
        behavior: "instant",
      });
      setY(0);
    }
  }, [pathname, setY]);
}
