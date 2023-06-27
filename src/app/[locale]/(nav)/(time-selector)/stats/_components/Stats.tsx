"use client";

import i18next from "i18next";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";

function formatNumber(n: number) {
  return Intl.NumberFormat(i18next.language, {
    notation: "compact",
  }).format(n);
}

function formatHour(hour: number) {
  return new Intl.DateTimeFormat(i18next.language, {
    hour: "numeric",
  }).format(
    (() => {
      const date = new Date();
      date.setHours(hour);
      return date;
    })()
  );
}

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
      value: (spentMoney || 0).toString(),
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
