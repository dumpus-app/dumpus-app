"use client";

import PageHeader from "./_components/PageHeader";
import Stats from "./_components/Stats";
import SendingTimes from "./_components/SendingTimes";
import DailySentMessages from "./_components/DailySentMessages";
import SimplePieChart from "~/components/data/PieChart";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { ChartBarIcon } from "@heroicons/react/24/solid";
import StatCard from "~/components/data/StatCard";
import ExtraStats from "./_components/ExtraStats";

export default function Page() {
  return (
    <>
      <PageHeader />
      <Stats />
      <SendingTimes />
      <DailySentMessages />
      <ExtraStats />
      {/*       
      <Section title="">
        <div className="grid grid-cols-1 gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8 md:grid-cols-3">
          <div className="grid gap-2 px-2">
            <StatCard value="100" label="app starts" />
            <StatCard value="100" label="app starts" />
            <StatCard value="100" label="app starts" />
          </div>
          <SimplePieChart data={[{ label: "coucou", value: 90 }, { label: 'Androd', value: 10 }]} legend="iOS" />
        </div>
      </Section> */}
    </>
  );
}
