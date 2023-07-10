"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
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
  const [deletePackage, selectedPackage, premium, setPremium] = useConfigStore(
    (state) => [
      state.deletePackage,
      state.computed.selectedPackage,
      state.premium,
      state.setPremium,
    ]
  );
  const api = usePackageAPI({ baseURL: selectedPackage?.backendURL });

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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
        {premium && (
          <Button
            variant="premium"
            onClick={async () => {
              if (!confirmed) {
                setConfirmed(true);
                return;
              }
              setLoading(true);
              await purchases.restorePurchases();
              setPremium(false);
              toast({
                variant: "brand",
                title: "Purchases restored",
                description: "Give us some feedback on GitHub!",
                icon: CheckCircleIcon,
              });
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading
              ? "Restoring..."
              : confirmed
              ? "Press to confirm :("
              : "Restore purchases"}
          </Button>
        )}
      </div>
    </Section>
  );
}
