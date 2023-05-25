import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import About from "./_components/About";
import Packages from "./_components/Packages";
import Languages from "./_components/Languages";
import DangerZone from "./_components/DangerZone";
import TopNav from "../(nav)/_components/TopNav";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <TopNav />
      <PageHeader />
      <About />
      <Packages />
      <div className="flex flex-col space-x-2 px-2 desktop-container sm:flex-row">
        <Languages />
        <DangerZone />
      </div>
    </>
  );
}
