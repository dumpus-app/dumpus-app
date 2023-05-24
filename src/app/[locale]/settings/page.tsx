import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import About from "./_components/About";
import Packages from "./_components/Packages";
import Languages from "./_components/Languages";
import DangerZone from "./_components/DangerZone";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <About />
      <Packages />
      <Languages />
      <DangerZone />
    </>
  );
}
