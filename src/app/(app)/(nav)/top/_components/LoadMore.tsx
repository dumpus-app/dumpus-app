"use client";

import clsx from "clsx";
import { useState } from "react";
import Button from "~/components/Button";
import { afterNextPaint } from "~/components/after-paint";
import Spinner from "~/components/Spinner";
import { useAppStore } from "~/stores";
import { useTranslation } from "~/i18n/client";
import { useShallow } from "zustand/react/shallow";

const isMobile = process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile";

export default function LoadMore({
  loadMore,
}: {
  loadMore: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  // The next page's query runs inside `loadMore` and holds the main thread,
  // so the button shows it's working first.
  const [loading, setLoading] = useState(false);
  const [premium, setOpen] = useAppStore(
    useShallow(({ config, ui }) => [
      config.premium,
      ui.setShowInAppPurchasesDialog,
    ]),
  );

  return (
    <>
      <div
        className={clsx(
          "relative",
          isMobile ? (premium ? "hidden" : "block") : "hidden",
        )}
      >
        <div className="absolute inset-0 top-auto h-16 bg-linear-to-t from-gray-950 to-gray-950/0"></div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          aria-busy={loading || undefined}
          onClick={() => {
            if (loading) return;
            setLoading(true);
            afterNextPaint(() => {
              loadMore().finally(() => setLoading(false));
            });
          }}
          className={clsx(
            "relative pressable text-brand-300 [--press-scale:0.94] hover:underline active:text-brand-400",
            isMobile ? (premium ? "block" : "hidden") : "block",
          )}
        >
          {t("stats.top.loadMore")}
          {loading && (
            <Spinner className="absolute top-1/2 left-full ml-2 -translate-y-1/2" />
          )}
        </button>
        <Button
          variant="premium"
          onClick={() => setOpen(true)}
          className={clsx(isMobile ? (premium ? "hidden" : "block") : "hidden")}
        >
          {t("stats.top.premium")}
        </Button>
      </div>
    </>
  );
}
