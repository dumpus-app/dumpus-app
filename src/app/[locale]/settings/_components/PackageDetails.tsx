"use client";

import { ClipboardDocumentIcon } from "@heroicons/react/24/solid";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useCopyToClipboard } from "react-use";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { selectedPackageAtom } from "~/stores";
import { formatDate } from "~/utils/format";

export default function PackageDetails() {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const [state, copyToClipboard] = useCopyToClipboard();

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
            copyToClipboard(
              formatDate(selectedPackage.dateAdded, {
                hour: false,
                minute: false,
              })
            );
          }}
          title={formatDate(selectedPackage.dateAdded, {
            hour: false,
            minute: false,
          })}
          description="Added on"
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
      </div>
    </Section>
  );
}
