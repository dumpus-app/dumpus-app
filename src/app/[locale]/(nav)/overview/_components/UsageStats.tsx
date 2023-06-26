"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import i18next from "i18next";

function formatNumber(n: number) {
  return Intl.NumberFormat(i18next.language, {
    notation: "compact",
  }).format(n);
}

export default function UsageStats() {
  const { networkSize, joinedGuilds } = useUsageStatsData();

  const data = [
    { value: formatNumber(joinedGuilds), label: "server joined" },
    { value: "N/A", label: "received calls" },
    { value: "N/A", label: "opened notifs." },
    { value: "N/A", label: "top hour" },
    {
      value: formatNumber(networkSize),
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
