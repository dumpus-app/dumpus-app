import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";
import About from "./_components/About";
import PackageSwitch from "./_components/PackageSwitch";
import Languages from "./_components/Languages";
import DangerZone from "./_components/DangerZone";
import TopNav from "../(nav)/_components/TopNav";
import PackageDetails from "./_components/PackageDetails";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <TopNav />
      <PageHeader />
      <About />
      <PackageDetails />
      <PackageSwitch />
      <div className="flex flex-col desktop-container sm:flex-row sm:space-x-2 sm:px-2">
        <Languages />
        <DangerZone />
      </div>
    </>
  );
}
