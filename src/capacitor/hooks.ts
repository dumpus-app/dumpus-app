"use client";

import { useEffect } from "react";
import { initCapacitor, purchases } from "~/capacitor";
// import { useAppStore } from "~/stores";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "Capacitor init" });

export function useCapacitor() {
  //   const setPremium = useAppStore(({ config }) => config.setPremium);

  useEffect(() => {
    let unsub: (() => void) | undefined = undefined;

    async function initializeCapacitor() {
      unsub = await initCapacitor();
      logger.info("Capacitor initialized");
      const product = await purchases.getProduct("supporter");
      if (product) {
        // TODO: check why always false
        // setPremium(product.owned);
      }
    }

    initializeCapacitor();

    return () => {
      unsub?.();
    };
  }, []);
}
