"use client";

import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Inside another `PageEnter` that is still entering, it stays still, so
 * content arriving with its page doesn't animate twice. It drops the class
 * once its animation ends, so content arriving later animates on its own.
 */
export default function PageEnter({
  className,
  children,
  onAnimationEnd,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState(true);

  useLayoutEffect(() => {
    if (ref.current?.parentElement?.closest(".page-enter")) {
      setEntering(false);
    }
  }, []);

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(entering && "page-enter", className)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setEntering(false);
        onAnimationEnd?.(e);
      }}
    >
      {children}
    </div>
  );
}
