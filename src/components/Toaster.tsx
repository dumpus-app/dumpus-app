"use client";

import { useAtomValue } from "jotai";
import { Toaster as ReactHotToaster, resolveValue } from "react-hot-toast";
import { bottomNavHeightAtom } from "~/stores/ui";

export default function Toaster() {
  const height = useAtomValue(bottomNavHeightAtom);

  return (
    <ReactHotToaster
      position="bottom-right"
      containerClassName="transition-transform duration-150"
      containerStyle={{ transform: `translateY(${-height}px)` }}
      reverseOrder={false}
    >
      {(t) => <>{resolveValue(t.message, t)}</>}
    </ReactHotToaster>
  );
}
