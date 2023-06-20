import type { Metadata, ResolvingMetadata } from "next";
import { initI18next, useTranslation } from "~/i18n";
import { locales } from "~/i18n/settings";
import { PageProps } from "~/types";
import LoadingScreen from "./_components/LoadingScreen";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
    <LoadingScreen
      data={{
        title: t("global.loading.title"),
        description: t("global.loading.description"),
      }}
    >
      {children}
    </LoadingScreen>
  );
}
