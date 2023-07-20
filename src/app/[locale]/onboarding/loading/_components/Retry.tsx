"use client";

import { Transition } from "@headlessui/react";
import Button from "~/components/Button";
import Link from "~/components/Link";

export default function Retry({ show }: { show: boolean }) {
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
        <Link href="/onboarding/access/link/">Retry</Link>
      </Button>
    </Transition>
  );
}
