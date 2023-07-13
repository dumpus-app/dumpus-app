"use client";

import useCapacitor from "~/hooks/use-capacitor";
import useStoreInit from "~/hooks/use-store-init";
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
  const init = useStoreInit();
  console.log(init);

  return (
    <Providers>
      <PageStructure>
        {init ? <ConnectivityHandler>{children}</ConnectivityHandler> : null}
      </PageStructure>
    </Providers>
  );
}
