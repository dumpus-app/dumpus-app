"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "~/stores";

export default function useRedirectParam(defaultPathname: string) {
  const searchParams = useSearchParams();
  const setRedirectParam = useAppStore(({ ui }) => ui.setRedirectParam);

  const href = searchParams?.get("redirect") || defaultPathname;

  useEffect(() => {
    setRedirectParam(href);
  }, [href, setRedirectParam]);

  return href;
}
