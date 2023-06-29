"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatHour, formatNumber } from "~/utils/format";

export default function UsageStats() {
  const { messageCount, networkSize, joinedGuilds, topHour, appStarted } =
    useUsageStatsData();

  const data = [
    {
      value: formatNumber(messageCount),
      label: "messages sent",
    },
    {
      value: formatNumber(joinedGuilds),
      label: "server joined",
    },
    { value: "N/A", label: "received calls" },
    { value: "N/A", label: "opened notifs." },
    { value: formatHour(topHour), label: "top hour" },
    {
      value: formatNumber(networkSize),
      label: "known users",
    },
    {
      value: formatNumber(appStarted),
      label: "Discord app started"
    }
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
