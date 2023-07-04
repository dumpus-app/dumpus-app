"use client";

import type { NextErrorProps } from "~/types";
import Error from "./_components/Error";

export default function ErrorBoundary(props: NextErrorProps) {
  return <Error {...props} />;
}
