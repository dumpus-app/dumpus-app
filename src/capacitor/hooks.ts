"use client";

import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffectOnce } from "react-use";
import { initCapacitor } from "~/capacitor";
import useToast from "~/hooks/use-toast";
import { useAppStore } from "~/stores";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "Capacitor init" });

export function useCapacitor() {
  const router = useRouter();
  const initPurchases = useAppStore(({ purchases }) => purchases.init);
  const toast = useToast();

  useEffectOnce(() => {
    let unsub: (() => void) | undefined = undefined;

    async function initializeCapacitor() {
      unsub = await initCapacitor({ router });
      await initPurchases({
        notify: (key) =>
          toast({
            title: "You're an Early Supporter",
            description: "Thanks for supporting us!",
            icon: CheckBadgeIcon,
            id: key,
          }),
      });
      logger.info("Capacitor initialized");
    }

    initializeCapacitor();

    return () => {
      unsub?.();
    };
  });
}
