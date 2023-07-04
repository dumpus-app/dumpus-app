"use client";

import { useAtomValue } from "jotai";
import { selectedPackageAtom } from "~/stores";

export default function EnsureSelectedPackage({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedPackage = useAtomValue(selectedPackageAtom);

  if (!selectedPackage) return null;

  return children;
}
