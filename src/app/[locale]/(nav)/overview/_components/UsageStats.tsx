"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";
import StatCard from "~/components/data/StatCard";

const DATA = [
  { value: "75", label: "server joined" },
  { value: "369", label: "received calls" },
  { value: "845", label: "opened notifs." },
  { value: "2 AM", label: "top hour" },
  { value: "48", label: "network size" },
];

export default function UsageStats() {
  return (
    <Section title="Usage stats" href="/stats">
      <ScrollArea orientation="horizontal">
        <div className="flex">
          {DATA.map((stat, i) => (
            <StatCard key={i} {...stat} className="ml-2 shrink-0" />
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
