"use client";

import { useSetAtom } from "jotai";
import Button from "~/components/Button";
import { showSharePopupAtom } from "~/stores/ui";

export default function Share() {
  const setOpen = useSetAtom(showSharePopupAtom);

  return (
    <div className="rounded-t-xl border border-b-0 border-gray-800 bg-gray-900 p-2">
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        Share
      </Button>
    </div>
  );
}
