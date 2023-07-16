"use client";

import { useState } from "react";
import { useMount, useUnmount } from "react-use";
import { useRouter } from "next/navigation";
import { initCapacitor, purchases } from "~/capacitor";
import { createLogger } from "~/utils/logger";
import { useAppStore } from "~/stores";

const logger = createLogger({ tag: "Capacitor init" });

export default function useCapacitor() {
  const router = useRouter();
  const [closeCapacitor, setCloseCapacitor] = useState<() => void>();
  const setPremium = useAppStore(({ config }) => config.setPremium);

  useMount(async () => {
    const closeCapacitor = await initCapacitor({ navigate: router.replace });
    setCloseCapacitor(closeCapacitor);
    logger.info("Capacitor initialized");
    const product = await purchases.getProduct("supporter");
    if (product) {
      // TODO: check why always false
      // setPremium(product.owned);
    }
  });

  useUnmount(() => {
    closeCapacitor?.();
  });
}
