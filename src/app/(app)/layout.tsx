"use client";

import { useAppStore } from "~/stores";
import EnsureSelectedPackage from "./_components/EnsureSelectedPackage";
import ExitDemoBanner from "./_components/ExitDemoBanner";
import SharePopup from "./_components/SharePopup";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const callPrompt = useAppStore(({ config }) => config.callPrompt);

  useEffect(() => {
    callPrompt();
  }, [callPrompt]);

  return (
    <EnsureSelectedPackage>
      <>
        <ExitDemoBanner />
        {children}
        <SharePopup />
      </>
    </EnsureSelectedPackage>
  );
}
