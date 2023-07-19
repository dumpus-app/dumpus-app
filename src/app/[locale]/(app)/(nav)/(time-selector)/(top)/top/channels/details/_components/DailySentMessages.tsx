"use client";

import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";
import SimpleLineChart from "~/components/data/SimpleLineChart";
import { useTranslation } from "~/i18n/client";

export default function DailySentMessages({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const { t } = useTranslation();
  return (
    <Section title="Messages sent per day">
      <SimpleBarChart
        data={data}
        className="px-2"
        legend={t("messageSentCount")}
      />
    </Section>
  );
}
