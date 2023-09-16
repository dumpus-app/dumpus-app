"use client";

import i18next from "i18next";
import { JetBrains_Mono, Rubik } from "next/font/google";
import { CSSProperties } from "react";
import { useCapacitor } from "~/capacitor/hooks";
import { useScrollTop } from "~/hooks/use-layout";
import useStoreInit from "~/hooks/use-store-init";
import SafeArea from "./SafeArea";
import Scripts from "./Scripts";
import Toaster from "./Toaster";

const sansFont = Rubik({ subsets: ["latin"] });
const monoFont = JetBrains_Mono({ subsets: ["latin"] });

export default function PageStructure({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language: locale = "en", dir = () => "ltr" } = i18next;

  useCapacitor();
  const init = useStoreInit();
  useScrollTop();

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${sansFont.className} h-full bg-gray-950 text-gray-400`}
      style={
        {
          "--font-mono": monoFont.style.fontFamily,
        } as CSSProperties
      }
    >
      <body className="flex min-h-full flex-col">
        <SafeArea>{init ? children : null}</SafeArea>
        <Toaster />
      </body>
      <Scripts />
    </html>
  );
}
