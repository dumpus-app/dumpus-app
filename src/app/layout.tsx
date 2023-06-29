"use client";

import i18next from "i18next";
import { Rubik } from "next/font/google";
import useCapacitor from "~/hooks/use-capacitor";
import "~/i18n/client";
import "./_css/globals.css";
import Providers from "./providers";

const font = Rubik({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language: locale = "en", dir = () => "ltr" } = i18next;
  useCapacitor();

  return (
    <Providers>
      <html
        lang={locale}
        dir={dir(locale)}
        className={`${font.className} h-full bg-gray-950 text-gray-400`}
      >
        <body className="flex min-h-full flex-col">{children}</body>
      </html>
    </Providers>
  );
}
