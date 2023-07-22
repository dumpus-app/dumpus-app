"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import StatCard from "~/components/data/StatCard";
import useSendingTimesData from "~/hooks/data/use-sending-times-data";
import { useTranslation } from "~/i18n/client";
import { formatHour, formatNumber } from "~/utils/format";

function Chart() {
  const { chartData } = useSendingTimesData();
  const { t } = useTranslation();

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
  const {t} = useTranslation()
  const {
    statsData: { avgMessagesSentPerDay, avgOpeningCountPerDay },
  } = useSendingTimesData();

  const data = [
    {
      value: formatNumber(avgMessagesSentPerDay),
      label: t("stats.averageMessages"),
    },
    {
      value: formatNumber(avgOpeningCountPerDay),
      label: t("stats.dayOppenings"),
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
    <Section title={t("discordHours")}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0">
        <Chart />
        <Stats />
      </div>
    </Section>
  );
}
