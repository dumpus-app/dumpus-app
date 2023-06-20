"use client";

import { Rubik } from "next/font/google";
import { I18nextProvider, getI18n } from "react-i18next";
import "~/i18n/client";
import { i18nInstance } from "~/i18n/client";
import "./globals.css";
import Providers from "./providers";

const font = Rubik({ subsets: ["latin"] });

function I18nWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18nInstance as any} defaultNS={"translation"}>
      {children}
    </I18nextProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const i18n = getI18n();
  const { language: locale = "en", dir = () => "ltr" } = i18n;

  return (
    <I18nWrapper>
      <html
        lang={locale}
        dir={dir(locale)}
        className={`${font.className} h-full bg-gray-950 text-gray-400`}
      >
        <Providers>
          <body className="flex min-h-full flex-col">{children}</body>
        </Providers>
      </html>
    </I18nWrapper>
  );
}
