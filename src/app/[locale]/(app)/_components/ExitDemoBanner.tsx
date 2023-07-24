"use client";

import { useState } from "react";
import Button from "~/components/Button";
import { useAppStore, useSelectedPackage } from "~/stores";
import { useTranslation } from "~/i18n/client";
import { useRouter } from "next/navigation";

export default function ExitDemoBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const deletePackage = useAppStore(({ config }) => config.deletePackage);
  const { package_id, id } = useSelectedPackage();

  const [loading, setLoading] = useState(false);
  const demo = package_id === "demo";

  async function handler() {
    setLoading(true);
    deletePackage({
      id,
      router,
    });
  }

  if (!demo) return null;

  return (
    <Button
      onClick={(e) => handler()}
      disabled={loading}
      size="sm"
      className="rounded-none"
    >
      {loading ? t("exitingDemo") : t("exitDemo")}
    </Button>
  );
}
