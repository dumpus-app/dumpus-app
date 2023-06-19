"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import StatCard from "~/components/data/StatCard";
import { useSendingTimesData } from "~/hooks/use-data";

function Chart() {
  const { chartData } = useSendingTimesData();

  return (
    <SimpleBarChart
      data={chartData}
      className="flex-1 px-2"
      legend="Messages sent"
    />
  );
}

function Stats() {
  const { statsData } = useSendingTimesData();
  return (
    <div className="">
      <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-1">
        {statsData.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>
    </div>
  );
}

export default function SendingTimes() {
  return (
    <Section title="Sending times" href="/stats#sending-times">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0">
        <Chart />
        <Stats />
      </div>
    </Section>
  );
}
