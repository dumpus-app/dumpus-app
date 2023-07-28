"use client";

import Button from "~/components/Button";
import Link from "~/components/Link";
import { useTranslation } from "~/i18n/client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import RenderMarkdown from "~/components/RenderMarkdown";
import { useI18nPathname } from "~/hooks/use-i18n";

const GET_DATA_LINK_PATHNAMES = [
  "/access",
  "/access/link",
  "/access/email",
].map((v) => `/onboarding${v}`);

function normalizePathname(pathname: string) {
  if (pathname !== "/onboarding/") {
    pathname = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  }
  return pathname;
}

function TrustDialog({
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
                        {t("onboarding.shared.trust")}
                      </Dialog.Title>
                    </div>
                    <div className="space-y-2 px-4 text-base text-gray-400">
                      {t("onboarding.shared.trustContent", {
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
                    {t("onboarding.shared.gotIt")}
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

export type Props = { href: string | null; label: string | null };

export default function Footer({ href, label }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pathname = useI18nPathname();
  const showGetDataLink = GET_DATA_LINK_PATHNAMES.includes(
    normalizePathname(pathname),
  );

  return (
    <>
      <div className="w-full space-y-2 p-4 text-center sm:mx-auto sm:max-w-sm">
        {showGetDataLink && (
          <Link
            href="/onboarding/intro/1"
            className="w-full py-3 text-gray-400 underline transition-colors hover:text-gray-300"
          >
            {t("onboarding.shared.getData")}
          </Link>
        )}
        {showGetDataLink && (
          <button
            type="button"
            onClick={(e) => setOpen(true)}
            className="w-full py-3 text-gray-400 underline transition-colors hover:text-gray-300"
          >
            {t("onboarding.shared.trust")}
          </button>
        )}
        {href && (
          <Button asChild>
            <Link href={href}>{label}</Link>
          </Button>
        )}
      </div>
      <TrustDialog {...{ open, setOpen }} />
    </>
  );
}
