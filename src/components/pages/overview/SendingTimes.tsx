"use client";

import Section from "~/components/Section";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import i18next from "i18next";

const CHART_DATA = [
  {
    name: "12 AM",
    value: 125,
  },
  {
    name: "3 AM",
    value: 2,
  },
  {
    name: "6 AM",
    value: 753,
  },
  {
    name: "9 AM",
    value: 1864,
  },
  {
    name: "12 PM",
    value: 1803,
  },
  {
    name: "3 PM",
    value: 475,
  },
  {
    name: "6 PM",
    value: 3574,
  },
  {
    name: "9 PM",
    value: 2756,
  },
];

function Chart() {
  return (
    <div className="h-48 overflow-hidden px-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CHART_DATA}>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            className="stroke-gray-700"
          />
          <XAxis
            dataKey="name"
            // stroke-gray-400
            stroke="#94a3b8"
          />
          <YAxis
            width={45}
            // stroke-gray-400
            stroke="#94a3b8"
            tickFormatter={(v, i) =>
              new Intl.NumberFormat(i18next.language, {
                notation: "compact",
              }).format(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "0.5rem",
            }}
            cursor={{ fill: "#ffffff25" }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name="Messages sent"
            // fill-brand-300
            fill="#7dd3fc"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATS_DATA = [
  {
    value: "1h43",
    label: "average time spent per day",
  },
  {
    value: "15",
    label: "Discord app openings per day",
  },
];

function Stats() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 px-2">
      {STATS_DATA.map((stat) => (
        // TODO: extract to stat card
        <div key={stat.label} className="rounded-lg bg-gray-900 p-2">
          <div className="font-semibold text-brand-300">{stat.value}</div>
          <div className="text-sm text-gray-50">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function SendingTimes() {
  return (
    <Section title="Sending times" href="/stats#sending-times">
      <Chart />
      <Stats />
    </Section>
  );
}
