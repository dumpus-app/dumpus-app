"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { shallow } from "zustand/shallow";
import Button from "~/components/Button";
import Section from "~/components/Section";
import packageAPI from "~/hooks/use-package-api";
import { getStorageKey } from "~/hooks/use-sql-init";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";
import { queryClient } from "~/utils/react-query";

export default function DangerZone() {
  const { t } = useTranslation();
  const router = useRouter();
  const [reset, packages, setUsersCache] = useAppStore(
    ({ config, setUsersCache }) => [
      config.reset,
      config.packages,
      setUsersCache,
    ],
    shallow,
  );

  const [loading, setLoading] = useState(false);

  async function handler() {
    setLoading(true);

    for (const { backendURL, package_id, UPNKey, id } of packages) {
      localStorage.removeItem(getStorageKey(id));
      if (package_id === "demo") break;

      await packageAPI({ baseURL: backendURL }).remove({
        packageID: package_id,
        UPNKey,
      });
    }

    reset();
    setUsersCache([]);
    router.replace("/onboarding/");
    queryClient.clear();
  }

  return (
    <Section title={t("settings.dangerZone.title")}>
      <div className="grid grid-cols-1 gap-2 px-2">
        <p className="text-gray-400">{t("settings.dangerZone.description")}</p>
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              handler();
            }}
            disabled={loading}
          >
            {loading
              ? t("settings.dangerZone.loading")
              : t("settings.dangerZone.quit")}
          </button>
        </Button>
      </div>
    </Section>
  );
}
