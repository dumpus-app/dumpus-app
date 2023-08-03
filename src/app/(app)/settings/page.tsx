"use client";

import PageHeader from "./_components/PageHeader";
import About from "./_components/About";
import PackageSwitch from "./_components/PackageSwitch";
import LocaleSwitch from "~/components/LocaleSwitch";
import DangerZone from "./_components/DangerZone";
import TopNav from "../(nav)/_components/TopNav";
import PackageDetails from "./_components/PackageDetails";
import Actions from "./_components/Actions";

export default function Page() {
  return (
    <>
      <TopNav />
      <PageHeader />
      <About />
      <PackageDetails />
      <Actions />
      <PackageSwitch />
      <div className="flex flex-col desktop-container sm:flex-row sm:space-x-2 sm:px-2">
        <LocaleSwitch />
        <DangerZone />
      </div>
    </>
  );
}
