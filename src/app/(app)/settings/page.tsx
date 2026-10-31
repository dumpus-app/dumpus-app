"use client";

import PageEnter from "~/components/PageEnter";
import TopNav from "../(nav)/_components/TopNav";
import About from "./_components/About";
import Actions from "./_components/Actions";
import DangerZone from "./_components/DangerZone";
import Languages from "./_components/Languages";
import PackageDetails from "./_components/PackageDetails";
import PackageSwitch from "./_components/PackageSwitch";
import PageHeader from "./_components/PageHeader";

export default function Page() {
  return (
    <>
      <TopNav />
      <PageEnter className="flex grow flex-col">
        <PageHeader />
        <About />
        <PackageDetails />
        <Actions />
        <PackageSwitch />
        <div className="desktop-container flex flex-col sm:flex-row sm:gap-2 sm:px-2">
          <Languages />
          <DangerZone />
        </div>
      </PageEnter>
    </>
  );
}
