"use client";

import Section from "~/components/Section";
import SimpleLineChart from "~/components/data/SimpleLineChart";

export default function DailySentMessages({
  data,
}: {
  data: {
    label: string;
    value: number;
  }[];
}) {
  return (
    <Section title="Daily sent messages">
      <SimpleLineChart
        data={data}
        className="px-2"
        legend="Messages sent"
        showSmallDots={data.length > 12}
      />
    </Section>
  );
}
