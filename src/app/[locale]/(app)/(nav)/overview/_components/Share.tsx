"use client";

import Button from "~/components/Button";
import { useAppStore } from "~/stores";

export default function Share() {
  const setOpen = useAppStore(({ ui }) => ui.setShowSharePopup);

  return (
    <div className="px-2 py-4 sm:hidden">
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        Share
      </Button>
    </div>
  );
}
