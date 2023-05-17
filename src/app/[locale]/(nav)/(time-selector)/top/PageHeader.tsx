"use client";

import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import Header from "~/components/layout/Header";

export default function PageHeader() {
  return (
    <Header
      title="Top"
      transparent
      leftSlot={
        <Header.Icon
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert("TBD");
          }}
          icon={AdjustmentsHorizontalIcon}
        />
      }
      rightSlot={
        <Header.Icon
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert("TBD");
          }}
          icon={Squares2X2Icon}
        />
      }
    />
  );
}
