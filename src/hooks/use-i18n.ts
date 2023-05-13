"use client";

import i18next from "i18next";
import { usePathname } from "next/navigation";

export function useI18nPathname() {
  const pathname = usePathname();
  if (!pathname) return "/";
  return pathname.replace(`/${i18next.language}`, "");
}
