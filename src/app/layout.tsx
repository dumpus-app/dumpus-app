"use client";

import useCapacitor from "~/hooks/use-capacitor";
import "~/i18n/client";
import ConnectivityHandler from "./_components/ConnectivityHandler";
import PageStructure from "./_components/PageStructure";
import "./_css/globals.css";
import Providers from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useCapacitor();

  return (
    <Providers>
      <PageStructure>
        <ConnectivityHandler>{children}</ConnectivityHandler>
      </PageStructure>
    </Providers>
  );
}
