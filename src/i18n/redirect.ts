"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import languageDetector from "./language-detector";
import { fallbackLocale } from "./settings";

export function useRedirect(_to?: string) {
  const pathname = usePathname();
  const router = useRouter();
  const to = _to || pathname || "/";

  useEffect(() => {
    const detectedLocale = languageDetector.detect() || fallbackLocale;
    const basePath = `/${detectedLocale}`;
    if (to.startsWith(basePath) && pathname === "/404") {
      router.replace(basePath + pathname);
      return;
    }

    languageDetector.cache?.(detectedLocale);
    router.replace(basePath + to);
  }, [pathname, router, to]);
}

export function Redirect({ to }: { to?: string }) {
  useRedirect(to);
  return null;
}
