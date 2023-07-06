"use client";

import { Transition, Dialog } from "@headlessui/react";
import { Fragment, useState } from "react";
import Button from "~/components/Button";
import Link from "~/components/Link";
import RenderMarkdown from "~/components/RenderMarkdown";
import { ESTIMATED_QUEUE_DURATION } from "~/constants";
import { useTranslation } from "~/i18n/client";
import { formatDuration } from "~/utils/format";

function QueueExplanationDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
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

        <div className="fixed inset-0 bottom-safe-area-bottom-inset z-10 overflow-y-auto">
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
              <Dialog.Panel className="relative transform rounded-lg border border-gray-800 bg-gray-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div>
                  <div className="text-center">
                    <div className="sticky top-0 bg-gray-900 p-4">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-bold text-white sm:text-2xl"
                      >
                        {t("onboarding.loading.queue.why")}
                      </Dialog.Title>
                    </div>
                    <div className="space-y-2 px-4 text-base text-gray-400">
                      {t("onboarding.loading.queue.whyContent", {
                        returnObjects: true,
                      }).map((p, i) => (
                        <p key={i} className="mt-2 text-gray-400">
                          <RenderMarkdown content={p} />
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 mt-2 bg-gray-900 p-4">
                  <Button
                    variant="brand"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    Got it!
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function QueueDisplay({ position }: { position: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.loading.queue.title")}
        </h1>
        <button
          type="button"
          onClick={(e) => setOpen(true)}
          className="w-full py-3 text-brand-300 transition-colors hover:text-brand-400"
        >
          {t("onboarding.loading.queue.why")}
        </button>
        <div className="mx-auto mt-4 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gray-800">
          <h2 className="text-6xl font-bold text-brand-300">{position}</h2>
          <p className="text-gray-400">
            {t("onboarding.loading.queue.position")}
          </p>
        </div>
        <p className="mt-4 text-gray-400">
          {t("onboarding.loading.queue.waitingTime")}{" "}
          <span className="text-brand-300">
            {formatDuration(position * ESTIMATED_QUEUE_DURATION)}
          </span>
        </p>
        <Button variant="gray" asChild className="mt-2 inline-flex">
          <Link href="/onboarding/access/link/">
            {t("onboarding.loading.queue.useBackend")}
          </Link>
        </Button>
      </div>
      <QueueExplanationDialog {...{ open, setOpen }} />
    </>
  );
}
