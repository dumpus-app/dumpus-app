"use client";

import { XCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { purchases } from "~/capacitor";
import Button from "~/components/Button";
import Link from "~/components/Link";
import Section from "~/components/Section";
import usePackageAPI from "~/hooks/use-package-api";
import useToast from "~/hooks/use-toast";
import { useConfigStore } from "~/stores/config";
import {
  LOCALSTORAGE_MAX_CAPACITY,
  getLocalStorageSize,
} from "~/utils/browser";

export default function Actions() {
  const [deletePackage, selectedPackage] = useConfigStore((state) => [
    state.deletePackage,
    state.computed.selectedPackage,
  ]);
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

    deletePackage(id);
  }

  const toast = useToast();

  // During reset
  if (!selectedPackage) return null;

  return (
    <Section title="Actions">
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
                title: "Can't add new package",
                description: "Not enough storage in app",
                icon: XCircleIcon,
              });
            }
          }}
        >
          <Link href="/onboarding/access">Add a new package</Link>
        </Button>
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              handler();
            }}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete current package"}
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
            {loading ? "Restoring..." : "Restore purchases"}
          </Button>
        )}
      </div>
    </Section>
  );
}
