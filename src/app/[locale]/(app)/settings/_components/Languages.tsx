"use client";

import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import i18next, { t } from "i18next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useRef, useState } from "react";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { useTranslation } from "~/i18n/client";
import { locales } from "~/i18n/settings";

function LocalesList() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  return (
    <RadioGroup
      value={i18next.language}
      onChange={(v) => {
        window.location.href = (
          pathname +
          "?" +
          searchParams?.toString()
        ).replace(`/${i18next.language}`, `/${v}`);
      }}
    >
      <RadioGroup.Label className="sr-only">Locales</RadioGroup.Label>
      <div className="space-y-2">
        {locales.map((locale) => (
          <RadioGroup.Option
            key={locale}
            value={locale}
            className={({ checked, active }) =>
              clsx(
                checked ? "border-transparent" : "border-gray-800",
                active ? "border-brand-700 ring-2 ring-brand-700" : "",
                "relative block cursor-pointer rounded-lg border bg-gray-950 px-6 py-4 focus:outline-none"
              )
            }
          >
            {({ active, checked }) => (
              <>
                <RadioGroup.Label
                  as="span"
                  className="font-medium text-gray-400"
                >
                  {new Intl.DisplayNames(["en"], { type: "language" }).of(
                    locale
                  )}
                </RadioGroup.Label>
                <span
                  className={clsx(
                    active ? "border" : "border-2",
                    checked ? "border-brand-700" : "border-transparent",
                    "pointer-events-none absolute -inset-px rounded-lg"
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}

function LocaleSwitcher({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const loadedRef = useRef(false);
  if (!loadedRef.current) {
    loadedRef.current = true;
    i18next.loadLanguages(locales);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
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
          <div className="flex min-h-full w-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-gray-800 bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div className="text-center">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-white"
                  >
                    {t("settings.languages.switch")}
                  </Dialog.Title>
                  <div className="mt-2">
                    <LocalesList />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function Languages() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Section title={t("settings.languages.title")}>
        <div className="px-2">
          <DetailCard
            onClick={() => setOpen(true)}
            title={
              new Intl.DisplayNames(["en"], { type: "language" }).of(
                i18next.language
              )!
            }
            description={t("settings.languages.description", {
              value: locales.length,
            })}
            reverseTexts
            rightIcon={ChevronRightIcon}
          />
        </div>
      </Section>
      <LocaleSwitcher open={open} setOpen={setOpen} />
    </>
  );
}
