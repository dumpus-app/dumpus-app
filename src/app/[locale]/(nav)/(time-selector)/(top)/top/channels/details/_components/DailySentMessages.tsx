"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";

export default function DailySentMessages({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <Section title="Messages sent per day">
      <SimpleBarChart data={data} className="px-2" legend="Messages sent" />
    </Section>
  );
}
