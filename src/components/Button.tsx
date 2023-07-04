"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  [
    "flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-75",
  ],
  {
    variants: {
      variant: {
        brand: "bg-brand-300 hover:bg-brand-400 text-gray-950",
        danger: "bg-danger-300 hover:bg-danger-400 text-gray-950",
        gray: "bg-gray-700 hover:bg-gray-600 text-gray-200",
        premium: "bg-[#B8A383] hover:bg-[#978365] text-[#3B352B]",
      },
      size: {
        sm: "px-4 py-2 text-base",
        md: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "md",
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
  { asChild = false, variant, size, className, type = "button", ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref as any}
      className={clsx(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
});
