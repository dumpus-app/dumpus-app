"use client";

import clsx from "clsx";
import { shallow } from "zustand/shallow";
import PremiumBadge from "~/components/PremiumBadge";
import { MdiCrown } from "~/components/icons";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";

const isMobile = process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile";

export default function BuyPremium({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [premium, setOpen] = useAppStore(
    ({ config, ui }) => [config.premium, ui.setShowInAppPurchasesDialog],
    shallow,
  );

  if (!isMobile || premium) return null;

  return (
    <button type="button" onClick={() => setOpen(true)}>
      <PremiumBadge
        icon={MdiCrown}
        text={t("premium.buy")}
        className={clsx("transition-colors hover:bg-yellow-400", className)}
      />
    </button>
  );
}
