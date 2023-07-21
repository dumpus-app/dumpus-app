"use client";

import { useAppStore } from "~/stores";
import { shallow } from "zustand/shallow";

export default function SafeArea({ children }: { children: React.ReactNode }) {
  const [topColor, bottomColor] = useAppStore(
    ({ ui }) => [ui.safeAreaTopColor, ui.safeAreaBottomColor],
    shallow
  );

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
