"use client";

import i18next from "i18next";
import { Rubik, JetBrains_Mono } from "next/font/google";
import { CSSProperties } from "react";
import Toaster from "~/components/Toaster";

const sansFont = Rubik({ subsets: ["latin"] });
const monoFont = JetBrains_Mono({ subsets: ["latin"] });

export default function PageStructure({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language: locale = "en", dir = () => "ltr" } = i18next;

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
        <div className="sticky top-0 z-50 h-safe-area-top-inset bg-gray-900" />
        {children}
        <Toaster />
        <div className="sticky bottom-0 z-50 h-safe-area-bottom-inset bg-gray-900" />
      </body>
    </html>
  );
}
