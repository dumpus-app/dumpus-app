"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import StatCard from "~/components/data/StatCard";
import useSendingTimesData from "~/hooks/data/use-sending-times-data";
import { formatHour, formatNumber } from "~/utils/format";
import { useTranslation } from "~/i18n/client";

function Chart() {
  const { t } = useTranslation();
  const { chartData } = useSendingTimesData();

  return (
    <SimpleLineChart
      data={(chartData || []).map(({ value, label }) => ({
        value,
        label: formatHour(label),
      }))}
      className="px-2 sm:flex-1"
      legend={t("messageSentCount")}
    />
  );
}

function Stats() {
  const { t } = useTranslation();
  const {
    statsData: { avgMessagesSentPerDay, avgOpeningCountPerDay },
  } = useSendingTimesData();

  const data = [
    {
      value: formatNumber(avgMessagesSentPerDay),
      label: t("sendingTimeStats.messagesSentPerDay"),
    },
    {
      value: formatNumber(avgOpeningCountPerDay),
      label: t("sendingTimeStats.appOpeningsPerDay"),
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
  const { t } = useTranslation();

  return (
    <Section title={t("discordHours")} href="/stats#sending-times">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0">
        <Chart />
        <Stats />
      </div>
    </Section>
  );
}
