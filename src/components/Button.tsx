"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  [
    "flex items-center justify-center rounded-lg px-6 py-3 text-lg font-medium text-gray-950 transition-colors",
  ],
  {
    variants: {
      variant: {
        primary: "bg-brand-300 hover:bg-brand-400",
        danger: "bg-danger-300 hover:bg-d anger-400",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean;
}

export default forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild = false, variant, className, type = "button", ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref as any}
      className={clsx(buttonVariants({ variant }), className)}
      type={type}
      {...props}
    />
  );
});
