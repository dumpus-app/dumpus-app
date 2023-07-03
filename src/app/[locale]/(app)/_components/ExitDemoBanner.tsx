"use client";

import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import Button from "~/components/Button";
import { getStorageKey } from "~/hooks/use-sql-init";
import {
  CONFIG_ATOM_INITIAL_VALUE,
  configAtom,
  selectedPackageAtom,
} from "~/stores";

export default function ExitDemoBanner() {
  const { package_id, id } = useAtomValue(selectedPackageAtom);
  const [config, setConfig] = useAtom(configAtom);

  const [loading, setLoading] = useState(false);
  const demo = package_id === "demo";

  async function handler() {
    setLoading(true);

    localStorage.removeItem(getStorageKey(id));

    const newConfig = structuredClone(config);
    const packageIndex = newConfig.db.packages.findIndex((p) => p.id === id)!;
    newConfig.db.packages.splice(packageIndex, 1);

    if (newConfig.db.packages.length === 0) {
      const value = structuredClone(CONFIG_ATOM_INITIAL_VALUE);
      value.goToOnboardingAccess = true;
      setConfig(value);
      window.location.href = "/";
    } else {
      newConfig.db.selectedId = newConfig.db.packages[0].id;
      setConfig(newConfig);
      window.location.reload();
    }
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
