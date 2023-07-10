"use client";

import { useState } from "react";
import Button from "~/components/Button";
import { useConfigStore } from "~/stores/config";

export default function ExitDemoBanner() {
  const [deletePackage, { package_id, id }] = useConfigStore((state) => [
    state.deletePackage,
    state.computed.selectedPackage,
  ]);

  const [loading, setLoading] = useState(false);
  const demo = package_id === "demo";

  async function handler() {
    setLoading(true);
    deletePackage(id);
  }

  if (!demo) return null;

  return (
    <Button
      onClick={(e) => handler()}
      disabled={loading}
      size="sm"
      className="rounded-none"
    >
      {loading ? "Exiting..." : "Exit demo and get started!"}
    </Button>
  );
}
