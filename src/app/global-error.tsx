"use client";

import type { NextErrorProps } from "~/types";
import PageStructure from "./_components/PageStructure";
import Error from "./_components/Error";

export default function GlobalErrorBoundary(props: NextErrorProps) {
  return (
    <PageStructure>
      <Error {...props} />
    </PageStructure>
  );
}
