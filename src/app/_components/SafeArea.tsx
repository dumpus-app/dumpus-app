"use client";

import { useAtomValue } from "jotai";
import { safeAreaBottomColorAtom, safeAreaTopColorAtom } from "~/stores/ui";

export default function SafeArea({ children }: { children: React.ReactNode }) {
  const topColor = useAtomValue(safeAreaTopColorAtom);
  const bottomColor = useAtomValue(safeAreaBottomColorAtom);

  return (
    <>
      <div
        className="sticky top-0 z-50 h-safe-area-top-inset transition"
        style={{ backgroundColor: topColor }}
      />
      {children}
      <div
        className="sticky bottom-0 z-50 h-safe-area-bottom-inset transition"
        style={{ backgroundColor: bottomColor }}
      />
    </>
  );
}
