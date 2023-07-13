"use client";

import { useEffect, useState } from "react";
import { syncAppStore } from "~/stores";

export default function useStoreInit() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    const unsub = syncAppStore();
    setInit(true);

    return () => {
      unsub();
    };
  }, []);

  return init;
}
