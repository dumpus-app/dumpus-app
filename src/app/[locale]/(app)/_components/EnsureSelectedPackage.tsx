"use client";

import { useConfigStore } from "~/stores/config";

export default function EnsureSelectedPackage({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedPackage = useConfigStore(
    (state) => state.computed.selectedPackage
  );

  if (!selectedPackage) return null;

  return children;
}
