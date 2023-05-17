"use client";

import { useWindowScroll } from "react-use";

export function useScrolled() {
  const { y } = useWindowScroll();
  return y > 120;
}
