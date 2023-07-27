"use client";

import useStoreInit from "~/hooks/use-store-init";
import "~/i18n/client";
import ConnectivityHandler from "./_components/ConnectivityHandler";
import PageStructure from "./_components/PageStructure";
import "./_css/globals.css";
import Providers from "./providers";
import { useCapacitor } from "~/capacitor/hooks";
import { useScrollTop } from "~/hooks/use-layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useCapacitor();
  const init = useStoreInit();
  useScrollTop();

  return (
    <Providers>
      <PageStructure>
        {init ? <ConnectivityHandler>{children}</ConnectivityHandler> : null}
      </PageStructure>
    </Providers>
  );
}
