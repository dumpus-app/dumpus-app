import type { Metadata, ResolvingMetadata } from "next";
import { initI18next } from "~/i18n";
import { locales } from "~/i18n/settings";
import type { PageProps } from "~/types";
import LoadingScreen from "./_components/LoadingScreen";
import { generateSEO } from "~/utils/seo";
import InAppPurchasesDialog from "~/components/InAppPurchasesDialog";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params: { locale } }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const i18nextInstance = await initI18next(locale);
  const t = i18nextInstance.getFixedT(locale);

  const title = t("seo.title");
  const description = t("seo.description");

  return generateSEO({ title, description });
}

export default function RootLayout({
  children,
}: PageProps<
  {},
  {
    children: React.ReactNode;
  }
>) {
  return (
    <LoadingScreen>
      {children}
      <InAppPurchasesDialog />
    </LoadingScreen>
  );
}
