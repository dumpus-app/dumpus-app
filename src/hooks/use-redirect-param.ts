"use client";

import { useSearchParams } from "next/navigation";

export default function useRedirectParam(defaultPathname: string) {
  const searchParams = useSearchParams();
  const href = searchParams?.get("redirect") || defaultPathname;

  return href;
}
