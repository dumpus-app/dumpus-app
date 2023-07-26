"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function useScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.hash) {
      window.document.scrollingElement?.scrollTo({
        left: 0,
        top: 0,
        behavior: "instant",
      });
    }
  }, [pathname]);
}
