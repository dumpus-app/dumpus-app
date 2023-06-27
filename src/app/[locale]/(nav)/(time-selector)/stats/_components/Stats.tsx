"use client";

import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatHour, formatMoney, formatNumber } from "~/utils/format";

export default function Stats() {
  const { networkSize, joinedGuilds, topHour, spentMoney } =
    useUsageStatsData();

  const data = [
    {
      value: joinedGuilds ? formatNumber(joinedGuilds) : "N/A",
      label: "server joined",
    },
    { value: "N/A", label: "received calls" },
    { value: "N/A", label: "opened notifs." },
    { value: topHour ? formatHour(topHour) : "N/A", label: "top hour" },
    {
      value: networkSize ? formatNumber(networkSize) : "N/A",
      label: "network size",
    },
    {
      value: formatMoney(spentMoney || 0),
      label: "spent",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-4 desktop-container sm:py-8">
      {data.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
