"use client";

import { ClipboardDocumentIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import Button from "~/components/Button";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import usePackageAPI from "~/hooks/use-package-api";
import { getStorageKey } from "~/hooks/use-sql";
import {
  CONFIG_ATOM_INITIAL_VALUE,
  configAtom,
  selectedPackageAtom,
} from "~/stores";

export default function PackageDetails() {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const [config, setConfig] = useAtom(configAtom);
  const api = usePackageAPI({ baseURL: selectedPackage?.backendURL });

  const [state, copyToClipboard] = useCopyToClipboard();
  const [loading, setLoading] = useState(false);

  async function handler() {
    setLoading(true);

    const { package_id, UPNKey, id } = selectedPackage;

    localStorage.removeItem(getStorageKey(id));
    if (package_id !== "demo") {
      await api.remove({
        packageID: package_id,
        UPNKey,
      });
    }

    const newConfig = { ...config };
    const packageIndex = newConfig.db.packages.findIndex((p) => p.id === id)!;
    newConfig.db.packages.splice(packageIndex, 1);

    if (newConfig.db.packages.length === 0) {
      setConfig(CONFIG_ATOM_INITIAL_VALUE);
      window.location.href = "/";
    } else {
      newConfig.db.selectedId = newConfig.db.packages[0].id;
      setConfig(newConfig);
      window.location.reload();
    }
  }

  useEffect(() => {
    if (state.error) {
      alert(`Unable to copy value: ${state.error.message}`);
    } else if (state.value) {
      alert("Copied to clipboard!");
    }
  }, [state]);

  // During reset
  if (!selectedPackage) return null;

  return (
    <Section title="Package details">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <DetailCard
          href="#"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(selectedPackage.UPNKey);
          }}
          title={selectedPackage.UPNKey}
          description="UPN Key"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          href="#"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(selectedPackage.issueDate);
          }}
          title={new Intl.DateTimeFormat(i18next.language, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(selectedPackage.issueDate))}
          description="Generated on"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          href="#"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(selectedPackage.package_id);
          }}
          title={selectedPackage.package_id}
          description="Package ID"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          href="#"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(selectedPackage.package_owner_name);
          }}
          title={selectedPackage.package_owner_name}
          description="Discord user"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          href="#"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard(selectedPackage.backendURL);
          }}
          title={selectedPackage.backendURL}
          description="Backend URL"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              handler();
            }}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </Button>
      </div>
    </Section>
  );
}
