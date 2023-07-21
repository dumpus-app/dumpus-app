"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatHour, formatNumber } from "~/utils/format";
import { useTranslation } from "~/i18n/client";
import { useSelectedPackage } from "~/stores";

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
  const { package_is_partial } = useSelectedPackage();

  const data: { value: string; label: string }[] = [
    {
      value: formatNumber(messageCount(), { notation: "standard" }),
      label: t("stats.messagesSent"),
    },
    package_is_partial
      ? null
      : {
          value: formatNumber(joinedGuilds(), { notation: "standard" }),
          label: t("stats.joinedServers"),
        },
    package_is_partial
      ? null
      : {
          value: formatNumber(receivedCalls(), { notation: "standard" }),
          label: t("stats.receivedCalls"),
        },
    { value: formatHour(topHour()), label: t("stats.topHour") },
    {
      value: formatNumber(networkSize(), { notation: "standard" }),
      label: t("stats.knownUsers"),
    },
    package_is_partial
      ? null
      : {
          value: formatNumber(appStarted(), { notation: "standard" }),
          label: t("stats.appStarted"),
        },
  ].filter((stat) => stat !== null) as any;

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
