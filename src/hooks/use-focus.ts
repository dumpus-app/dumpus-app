"use client";

import { useEffect, useState } from "react";


export default function useFocus<E extends HTMLElement>(
  target?: React.RefObject<E> | null,
  onFocusChange?: (focused: boolean) => void;
) {
  const [focused, setFocused] = useState(() => {
    return window.document.activeElement != null;
  });

  useEffect(() => {
    onFocusChange?.(focused);
  }, [focused, onFocusChange]);

  useEffect(() => {
    const focusTarget = target?.current ?? window;

    const blurListener = () => {
      setFocused(false);
    };

    const focusListener = () => {
      setFocused(true);
    };

    focusTarget.addEventListener("blur", blurListener);
    focusTarget.addEventListener("focus", focusListener);

    return () => {
      focusTarget.removeEventListener("blur", blurListener);
      focusTarget.removeEventListener("focus", focusListener);
    };
  }, [target]);

  return focused;
}
