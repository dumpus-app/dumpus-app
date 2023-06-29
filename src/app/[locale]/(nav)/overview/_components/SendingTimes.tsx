"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import StatCard from "~/components/data/StatCard";
import useSendingTimesData from "~/hooks/data/use-sending-times-data";
import { formatHour, formatNumber } from "~/utils/format";

function Chart() {
  const { chartData } = useSendingTimesData();

  return (
    <SimpleBarChart
      data={(chartData || []).map(({ value, label }) => ({
        value,
        label: formatHour(label),
      }))}
      className="flex-1 px-2"
      legend="Messages sent"
    />
  );
}

function Stats() {
  const {
    statsData: { avgMessagesSentPerDay },
  } = useSendingTimesData();

  const data = [
    {
      value: formatNumber(avgMessagesSentPerDay),
      label: "average messages sent per day",
    },
    {
      value: "N/A",
      label: "Discord app openings per day",
    },
  ];

  return (
    <div className="">
      <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-1">
        {data.map((stat, i) => (
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
