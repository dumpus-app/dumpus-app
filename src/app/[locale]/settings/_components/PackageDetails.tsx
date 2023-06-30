"use client";

import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useCopyToClipboard } from "react-use";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import useToast from "~/hooks/use-toast";
import { selectedPackageAtom } from "~/stores";
import { formatDate } from "~/utils/format";

export default function PackageDetails() {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const [state, copyToClipboard] = useCopyToClipboard();
  const toast = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "danger",
        title: "Can't copy to clipboard",
        description: state.error.message,
        icon: XCircleIcon,
      });
    } else if (state.value) {
      let sliced = state.value.slice(0, 40);
      if (sliced.length !== state.value.length) {
        sliced += "...";
      }
      toast({
        title: "Copied to clipboard!",
        description: sliced,
        icon: CheckCircleIcon,
      });
    }
  }, [state, toast]);

  // During reset
  if (!selectedPackage) return null;

  return (
    <Section title="Package details">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <DetailCard
          onClick={() => copyToClipboard(selectedPackage.UPNKey)}
          title={selectedPackage.UPNKey}
          description="UPN Key"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          onClick={() =>
            copyToClipboard(
              formatDate(selectedPackage.dateAdded, {
                hour: false,
                minute: false,
              })
            )
          }
          title={formatDate(selectedPackage.dateAdded, {
            hour: false,
            minute: false,
          })}
          description="Added on"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          onClick={() => copyToClipboard(selectedPackage.package_id)}
          title={selectedPackage.package_id}
          description="Package ID"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          onClick={() => copyToClipboard(selectedPackage.package_owner_name)}
          title={selectedPackage.package_owner_name}
          description="Discord user"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
        <DetailCard
          onClick={() => copyToClipboard(selectedPackage.backendURL)}
          title={selectedPackage.backendURL}
          description="Backend URL"
          reverseTexts
          rightIcon={ClipboardDocumentIcon}
        />
      </div>
    </Section>
  );
}
