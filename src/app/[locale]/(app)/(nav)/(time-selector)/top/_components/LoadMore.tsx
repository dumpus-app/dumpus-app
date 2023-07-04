"use client";

import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import Button from "~/components/Button";
import { configAtom } from "~/stores";
import { showInAppPurchasesDialogAtom } from "~/stores/ui";

export default function LoadMore({ loadMore }: { loadMore: () => void }) {
  const { premium } = useAtomValue(configAtom);
  const setOpen = useSetAtom(showInAppPurchasesDialogAtom);

  return (
    <>
      {/* TODO: implement on desktop */}
      <div className={clsx("relative", premium ? "hidden" : "block sm:hidden")}>
        <div className="absolute inset-0 top-auto h-16 bg-gradient-to-t from-gray-950 to-gray-950/0"></div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => loadMore()}
          className={clsx(
            "text-brand-300 hover:underline",
            premium ? "" : "hidden sm:block"
          )}
        >
          Load more
        </button>
        <Button
          variant="premium"
          onClick={() => setOpen(true)}
          className={clsx(premium ? "hidden" : "block sm:hidden")}
        >
          Unlock to view more!
        </Button>
      </div>
    </>
  );
}
