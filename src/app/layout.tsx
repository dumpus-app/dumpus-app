"use client";

import i18next, { dir } from "i18next";
import { Rubik } from "next/font/google";
import "~/i18n/client";
import "./globals.css";
import Providers from "./providers";

const font = Rubik({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = i18next.language;
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
