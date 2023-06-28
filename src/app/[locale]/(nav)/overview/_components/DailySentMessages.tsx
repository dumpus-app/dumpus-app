"use client";

import Section from "~/components/Section";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import useDailySentMessagesData from "~/hooks/data/use-daily-sent-messages-data";
import { formatDate } from "~/utils/format";

export default function DailySentMessages() {
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
    <Section title="Daily sent messages" href="/stats#daily-sent-messages">
      <SimpleLineChart
        data={data}
        className="px-2"
        legend="Messages sent"
        showSmallDots={(data?.length || 0) > 12}
      />
    </Section>
  );
}
