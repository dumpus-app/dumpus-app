"use client";

import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffectOnce } from "react-use";
import { initCapacitor } from "~/capacitor";
import useToast from "~/hooks/use-toast";
import { useAppStore } from "~/stores";
import { createLogger } from "~/utils/logger";
import { useTranslation } from "~/i18n/client";

const logger = createLogger({ tag: "Capacitor init" });

export function useCapacitor() {
  const { t } = useTranslation();
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
            title: t("premium.success"),
            description: t("premium.thanks"),
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
