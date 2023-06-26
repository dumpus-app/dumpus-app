"use client";

import Section from "~/components/Section";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import useDailySentMessagesData from "~/hooks/data/use-daily-sent-messages-data";

export default function DailySentMessages() {
  const data = useDailySentMessagesData();

  return (
    <Section title="Daily sent messages" href="/stats#daily-sent-messages">
      <SimpleLineChart
        data={data}
        className="px-2"
        legend="Messages sent"
        showSmallDots={data.length > 12}
      />
    </Section>
  );
}
