import { PageProps } from "~/types";
import "./globals.css";
import { Rubik } from "next/font/google";
import { dir } from "i18next";
import { locales } from "~/i18n/settings";
import Providers from "./providers";
import LoadingScreen from "./_components/LoadingScreen";
import "~/i18n/client";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const font = Rubik({ subsets: ["latin"] });

export const metadata = {
  title: "Dumpus",
  description: "Get detailed insights and stats for your Discord account",
};

export default function RootLayout({
  children,
  params: { locale },
}: PageProps<
  {},
  {
    children: React.ReactNode;
  }
>) {
  return (
    <Providers>
      <html
        lang={locale}
        dir={dir(locale)}
        className={`${font.className} h-full bg-gray-950 text-gray-400`}
      >
        <body className="flex min-h-full flex-col">
          <LoadingScreen>{children}</LoadingScreen>
        </body>
      </html>
    </Providers>
  );
}
