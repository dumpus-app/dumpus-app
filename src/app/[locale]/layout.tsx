import type { Metadata, ResolvingMetadata } from "next";
import { PageProps } from "~/types";
import "./globals.css";
import { Rubik } from "next/font/google";
import { dir } from "i18next";
import { locales } from "~/i18n/settings";
import Providers from "./providers";
import LoadingScreen from "./_components/LoadingScreen";
import "~/i18n/client";
import { initI18next, useTranslation } from "~/i18n";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const font = Rubik({ subsets: ["latin"] });

export async function generateMetadata(
  { params: { locale } }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const i18nextInstance = await initI18next(locale);
  const t = i18nextInstance.getFixedT(locale);

  return {
    title: t("seo.title"),
    description: t("seo.description"),
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: PageProps<
  {},
  {
    children: React.ReactNode;
  }
>) {
  const { t } = await useTranslation(locale);

  return (
    <Providers>
      <html
        lang={locale}
        dir={dir(locale)}
        className={`${font.className} h-full bg-gray-950 text-gray-400`}
      >
        <body className="flex min-h-full flex-col">
          <LoadingScreen
            data={{
              title: t("global.loading.title"),
              description: t("global.loading.description"),
            }}
          >
            {children}
          </LoadingScreen>
        </body>
      </html>
    </Providers>
  );
}
