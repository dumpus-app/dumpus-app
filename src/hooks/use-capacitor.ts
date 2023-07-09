"use client";

import { useState } from "react";
import { useMount, useUnmount } from "react-use";
import { useRouter } from "next/navigation";
import { initCapacitor } from "~/capacitor";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "Capacitor init" });

export default function useCapacitor() {
  const [closeCapacitor, setCloseCapacitor] = useState<() => void>();
  const router = useRouter();

  useMount(async () => {
    const closeCapacitor = await initCapacitor({ navigate: router.replace });
    setCloseCapacitor(closeCapacitor);
    logger.info("Capacitor initialized");
  });

  useUnmount(() => {
    closeCapacitor?.();
  });
}
