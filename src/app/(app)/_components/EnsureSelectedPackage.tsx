"use client";

import { useSelectedPackage } from "~/stores";

export default function EnsureSelectedPackage({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedPackage = useSelectedPackage();

  if (!selectedPackage) return null;

  return children;
}
