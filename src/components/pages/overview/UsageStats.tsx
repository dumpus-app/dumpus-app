"use client";

import Section from "~/components/Section";
import ScrollArea from "~/components/ScrollArea";

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
          {DATA.map((stat) => (
            // TODO: extract to stat card
            <div
              key={stat.label}
              className="ml-2 shrink-0 rounded-lg bg-gray-900 p-2"
            >
              <div className="font-semibold text-brand-300">{stat.value}</div>
              <div className="text-sm text-gray-50">{stat.label}</div>
            </div>
          ))}
          <ScrollArea.Spacer />
        </div>
      </ScrollArea>
    </Section>
  );
}
