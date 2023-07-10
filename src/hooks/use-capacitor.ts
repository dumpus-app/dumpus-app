"use client";

import { useState } from "react";
import { useMount, useUnmount } from "react-use";
import { useRouter } from "next/navigation";
import { initCapacitor, purchases } from "~/capacitor";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "Capacitor init" });

export default function useCapacitor() {
  const [closeCapacitor, setCloseCapacitor] = useState<() => void>();
  const router = useRouter();

  function purchasesCheck() {}

  useMount(async () => {
    const closeCapacitor = await initCapacitor({ navigate: router.replace });
    setCloseCapacitor(closeCapacitor);
    logger.info("Capacitor initialized");
    const product = await purchases.getProduct("supporter_test");
    if (product) {
      console.log(product);
      console.log(product.owned);
    }
  });

  useUnmount(() => {
    closeCapacitor?.();
  });
}
