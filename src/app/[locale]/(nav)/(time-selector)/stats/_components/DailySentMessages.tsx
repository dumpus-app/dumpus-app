"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import useDailySentMessagesData from "~/hooks/data/use-daily-sent-messages-data";
import { useTranslation } from "~/i18n/client";
import { formatDate } from "~/utils/format";

export default function DailySentMessages() {
  const { t } = useTranslation();
  const rawData = useDailySentMessagesData();
  const data = (rawData || []).map(({ value, label }) => ({
    value,
    label: formatDate(label, {
      year: "2-digit",
      day: false,
      hour: false,
      minute: false,
    }),
  }));

  return (
    <Section title={t('activityTime')}>
      <SimpleBarChart
        data={data}
        className="px-2"
        legend={t('messageSentCount')}
      />
    </Section>
  );
}
