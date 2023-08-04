import type { Metadata } from "next";
import { initI18next } from "~/i18n";
import { fallbackLocale } from "~/i18n/settings";
import { generateSEO } from "~/utils/seo";
import ConnectivityHandler from "./_components/ConnectivityHandler";
import PageStructure from "./_components/PageStructure";
import "./_css/globals.css";
import Providers from "./providers";
import LoadingScreen from "./_components/LoadingScreen";
import InAppPurchasesDialog from "~/components/InAppPurchasesDialog";

export async function generateMetadata(): Promise<Metadata> {
  const i18nextInstance = await initI18next(fallbackLocale);
  const t = i18nextInstance.getFixedT(fallbackLocale);

  const title = t("seo.title");
  const description = t("seo.description");

  return generateSEO({ title, description });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <PageStructure>
        <ConnectivityHandler>
          <LoadingScreen>
            {children}
            <InAppPurchasesDialog />
          </LoadingScreen>
        </ConnectivityHandler>
      </PageStructure>
    </Providers>
  );
}
