"use client";

import { Transition } from "@headlessui/react";
import i18next from "i18next";
import Button from "~/components/Button";
import Link from "~/components/Link";
import { queryClient } from "~/utils/react-query";

export default function Retry({ show, url }: { show: boolean; url: string }) {
  return (
    <Transition
      show={show}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Button asChild>
        <Link
          href={`/${i18next.language}${url}`}
          noI18n
          onClick={() => queryClient.clear()}
        >
          Retry
        </Link>
      </Button>
    </Transition>
  );
}
