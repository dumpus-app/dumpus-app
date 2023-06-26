"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import i18next from "i18next";

export default function UsageStats() {
  const { networkSize } = useUsageStatsData();

  const data = [
    { value: "75", label: "server joined" },
    { value: "369", label: "received calls" },
    { value: "845", label: "opened notifs." },
    { value: "2 AM", label: "top hour" },
    {
      value: Intl.NumberFormat(i18next.language, {
        notation: "compact",
      }).format(networkSize),
      label: "network size",
    },
  ];

  return (
    <Section title="Usage stats" href="/stats">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {data.map((stat, i) => (
            <StatCard key={i} {...stat} className="ml-2 shrink-0" />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
