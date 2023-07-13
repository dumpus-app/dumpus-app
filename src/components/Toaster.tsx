"use client";

import { Toaster as ReactHotToaster, resolveValue } from "react-hot-toast";
import { useAppStore } from "~/stores";

export default function Toaster() {
  const height = useAppStore(({ ui }) => ui.bottomNavHeight);

  return (
    <ReactHotToaster
      position="bottom-right"
      containerClassName="transition-transform duration-150"
      containerStyle={{
        transform: `translateY(${-height}px)`,
        bottom: "calc(var(--safe-area-bottom-inset) + 16px)",
      }}
      reverseOrder={false}
    >
      {(t) => <>{resolveValue(t.message, t)}</>}
    </ReactHotToaster>
  );
}
