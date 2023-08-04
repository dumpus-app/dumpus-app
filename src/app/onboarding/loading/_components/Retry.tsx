"use client";

import { Transition } from "@headlessui/react";
import Link from "next/link";
import Button from "~/components/Button";
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
        <Link href={url} onClick={() => queryClient.clear()}>
          Retry
        </Link>
      </Button>
    </Transition>
  );
}
