"use client";

import clsx from "clsx";
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
import { formatNumber } from "~/utils/format";

export type Props = {
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
  legend: string;
};

export default function SimpleBarChart({ data, className, legend }: Props) {
  return (
    <div className={clsx("h-48 overflow-hidden sm:h-72", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            className="stroke-gray-700"
          />
          <XAxis
            dataKey="label"
            // stroke-gray-400
            stroke="#94a3b8"
          />
          <YAxis
            width={45}
            // stroke-gray-400
            stroke="#94a3b8"
            tickFormatter={(v, i) => formatNumber(v)}
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
            name={legend}
            // fill-brand-300
            fill="#7dd3fc"
            animationDuration={300}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
