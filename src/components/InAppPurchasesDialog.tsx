"use client";

import { Dialog, Transition } from "@headlessui/react";
import { CheckBadgeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { useAtom } from "jotai";
import { Fragment, useState } from "react";
import { useMount } from "react-use";
import { purchases } from "~/capacitor";
import Button from "~/components/Button";
import useToast from "~/hooks/use-toast";
import { configAtom } from "~/stores";
import { showInAppPurchasesDialogAtom } from "~/stores/ui";
import { emitter } from "~/utils/emitter";
import { formatMoney } from "~/utils/format";

// TODO: extract to i18n
const content = [
  "Supporter role on Discord",
  "Up to 100+ DMs leaderboard",
  "Upload one package every 30 days",
];

export default function InAppPurchasesDialog() {
  const [open, setOpen] = useAtom(showInAppPurchasesDialogAtom);
  const [supported, setSupported] = useState(false);
  const [product, setProduct] =
    useState<ReturnType<typeof purchases.getProduct>>();
  const [config, setConfig] = useAtom(configAtom);
  const toast = useToast();

  useMount(() => {
    emitter.on("purchases:initialized", () => {
      setSupported(true);
      setProduct(purchases.getProduct("supporter_test"));
      emitter.on("purchases:transaction:approved", ({ key, product }) => {
        if (key === "supporter_test") {
          const newConfig = structuredClone(config);
          newConfig.premium = true;
          setConfig(newConfig);
          toast({
            title: "You're an Early Supporter",
            description: "Thanks for supporting us!",
            icon: CheckBadgeIcon,
            id: key,
          });
          setOpen(false);
        }
      });
    });
  });

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-950 bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform rounded-2xl border border-gray-800 bg-gray-900 p-4 text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
                <div>
                  <div className="text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold text-white sm:text-2xl"
                    >
                      Support us
                    </Dialog.Title>
                    <div className="mt-2 w-full space-y-2 text-left text-base text-gray-400">
                      {content.map((p, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-brand-300" />
                          <div className="text-gray-400">{p}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {supported && product ? (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <div className="rounded-lg border-[3px] border-success-400 bg-gray-800 p-2">
                        <div className="flex items-center justify-between">
                          <div className="text-lg text-gray-50">
                            Early supporter
                          </div>
                          <div className="rounded-full bg-success-400 px-2 py-0.5 text-sm text-gray-950">
                            60% off
                          </div>
                        </div>
                        <div className="mt-1 flex items-end justify-between">
                          <div className="text-3xl font-semibold text-white">
                            {formatMoney(
                              product.pricing!.priceMicros / 1_000_000,
                              { currency: product.pricing!.currency }
                            )}
                          </div>
                          <div className="text-gray-400">one-time</div>
                        </div>
                      </div>
                      <div className="rounded-lg border-[3px] border-transparent bg-gray-800 p-2 opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="text-lg text-gray-50">Supporter</div>
                          <div className="rounded-full bg-brand-300 px-2 py-0.5 text-sm text-gray-950">
                            Soon
                          </div>
                        </div>
                        <div className="mt-1 flex items-end justify-between">
                          <div className="text-3xl font-semibold text-white">
                            3.29€
                          </div>
                          <div className="text-gray-400">one-time</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center font-mono text-danger-400">
                      Payments not supported
                    </div>
                  )}
                </div>
                <Button
                  variant="brand"
                  className="mt-4 w-full"
                  onClick={() => {
                    product!.getOffer()!.order();
                  }}
                  disabled={!supported}
                >
                  {supported ? "Proceed" : "Unavailable"}
                </Button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mb-2 mt-1 w-full py-2 text-gray-400 underline transition-colors hover:text-gray-300"
                >
                  Maybe later
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
