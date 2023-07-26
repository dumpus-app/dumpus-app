"use client";

import { XCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { purchases } from "~/capacitor";
import Button from "~/components/Button";
import Link from "~/components/Link";
import Section from "~/components/Section";
import usePackageAPI from "~/hooks/use-package-api";
import useToast from "~/hooks/use-toast";
import { useTranslation } from "~/i18n/client";
import { useAppStore, useSelectedPackage } from "~/stores";
import {
  LOCALSTORAGE_MAX_CAPACITY,
  getLocalStorageSize,
} from "~/utils/browser";
import { queryClient } from "~/utils/react-query";

export default function Actions() {
  const { t } = useTranslation();
  const router = useRouter();
  const deletePackage = useAppStore(({ config }) => config.deletePackage);
  const selectedPackage = useSelectedPackage();
  const api = usePackageAPI({ baseURL: selectedPackage?.backendURL });

  const [loading, setLoading] = useState(false);

  async function handler() {
    setLoading(true);

    const { package_id, UPNKey, id } = selectedPackage;

    if (package_id !== "demo") {
      await api.remove({
        packageID: package_id,
        UPNKey,
      });
    }

    deletePackage({
      id,
      router,
    });
    setLoading(false);
  }

  const toast = useToast();

  // During reset
  if (!selectedPackage) return null;

  return (
    <Section title={t("settings.actions.title")}>
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Button
          asChild
          variant="brand"
          onClick={(e) => {
            const size = getLocalStorageSize();
            if (size >= LOCALSTORAGE_MAX_CAPACITY) {
              e.preventDefault();
              toast({
                variant: "danger",
                title: t("settings.actions.notEnoughStorage.title"),
                description: t("settings.actions.notEnoughStorage.description"),
                icon: XCircleIcon,
              });
            }
          }}
        >
          <Link onClick={() => queryClient.clear()} href="/onboarding/access">
            {t("settings.actions.addPackage")}
          </Link>
        </Button>
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              handler();
            }}
            disabled={loading}
          >
            {loading
              ? t("settings.actions.deleting")
              : t("settings.actions.delete")}
          </button>
        </Button>
        {process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile" && (
          <Button
            variant="premium"
            onClick={async () => {
              setLoading(true);
              await purchases.restorePurchases();
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading
              ? t("settings.actions.restoring")
              : t("settings.actions.restorePurchases")}
          </Button>
        )}
      </div>
    </Section>
  );
}
