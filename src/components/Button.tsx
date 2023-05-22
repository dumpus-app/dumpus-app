"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

const TAG = "button" as const satisfies keyof HTMLElementTagNameMap;
type Tag = typeof TAG;

type TagElement = HTMLElementTagNameMap[Tag];

export interface ButtonProps extends Record<string, any> {
  asChild?: boolean;
}

export default forwardRef<TagElement, ButtonProps>(function Button(
  { asChild = false, className, ...props },
  ref
) {
  const Comp = asChild ? Slot : TAG;

  return (
    <Comp
      ref={ref as any}
      className={clsx(
        "flex items-center justify-center rounded-lg bg-brand-300 px-6 py-3 text-lg font-medium text-gray-950 transition-colors hover:bg-brand-400",
        className
      )}
      {...props}
    />
  );
});
