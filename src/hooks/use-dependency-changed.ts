"use client";

import { useEffect } from "react";

export default function useDependencyChanged(
  callback: () => void,
  dependency: any
) {
  useEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency]);
}
