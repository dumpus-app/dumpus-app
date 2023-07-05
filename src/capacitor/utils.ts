"use client";

export function isCapacitorSupported() {
  return (
    process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile" &&
    typeof document !== "undefined" &&
    typeof window !== "undefined"
  );
}
