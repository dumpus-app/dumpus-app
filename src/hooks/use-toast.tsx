"use client";

import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { Fragment } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "~/types";

const toastVariants = cva("", {
  variants: {
    variant: {
      brand: "text-brand-300",
      danger: "text-danger-300",
    },
  },
  defaultVariants: {
    variant: "brand",
  },
});

type ToastVariants = VariantProps<typeof toastVariants>;

export default function useToast() {
  function toastFn({
    title,
    description,
    icon: Icon,
    automaticallyDismiss = true,
    variant,
  }: {
    title: string;
    description: string;
    icon: Icon;
    automaticallyDismiss?: boolean;
  } & ToastVariants) {
    toast(
      ({ visible, id }) => (
        <Transition
          show={visible}
          appear={true}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
            <div className="p-4">
              <div className="flex items-start">
                <div className="mt-0.5 flex-shrink-0">
                  <Icon
                    className={clsx("h-6 w-6", toastVariants({ variant }))}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="break-all text-lg font-bold text-white">
                    {title}
                  </p>
                  <p className="break-all text-base text-gray-400">
                    {description}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 focus:ring-offset-gray-800"
                    onClick={() => {
                      toast.dismiss(id);
                    }}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      ),
      { duration: automaticallyDismiss ? 4000 : Infinity, style: {} }
    );
  }

  return toastFn;
}
