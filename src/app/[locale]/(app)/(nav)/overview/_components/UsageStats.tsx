"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatHour, formatNumber } from "~/utils/format";
import { useTranslation } from "~/i18n/client";

export default function UsageStats() {
  const {
    messageCount,
    networkSize,
    joinedGuilds,
    topHour,
    appStarted,
    receivedCalls,
  } = useUsageStatsData();
  const { t } = useTranslation();

  const data = [
    {
      value: formatNumber(messageCount(), { notation: "standard" }),
      label: "messages sent",
    },
    {
      value: formatNumber(joinedGuilds(), { notation: "standard" }),
      label: "server joined",
    },
    {
      value: formatNumber(receivedCalls(), { notation: "standard" }),
      label: "received calls",
    },
    { value: formatHour(topHour()), label: "top hour" },
    {
      value: formatNumber(networkSize(), { notation: "standard" }),
      label: "known users",
    },
    {
      value: formatNumber(appStarted(), { notation: "standard" }),
      label: "Discord app started",
    },
  ];

  return (
    <Section title={t("sheerNumbers")} href="/stats">
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
