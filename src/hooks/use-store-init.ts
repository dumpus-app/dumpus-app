"use client";

import { useEffect } from "react";
import { syncAppStore } from "~/stores";

export default function useStoreInit() {
  useEffect(() => {
    const unsubscribe = syncAppStore();

    return () => {
      unsubscribe();
    };
  }, []);
}
