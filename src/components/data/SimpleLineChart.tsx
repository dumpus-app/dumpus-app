"use client";

import clsx from "clsx";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import i18next from "i18next";

export type Props = {
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
  legend: string;
  showSmallDots?: boolean;
};

export default function SimpleLineChart({
  data,
  className,
  legend,
  showSmallDots = false,
}: Props) {
  return (
    <div className={clsx("h-48 overflow-hidden sm:h-72", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            cursor={{ fill: "#ffffff25", stroke: "#ffffff25", strokeWidth: 6 }}
          />
          <Legend />
          <Line
            dataKey="value"
            type="monotone"
            // className="fill-brand-200"
            name={legend}
            // stroke-brand-300
            stroke="#7dd3fc"
            strokeWidth={2}
            dot={{
              fill: "#7dd3fc",
              stroke: "#7dd3fc",
              strokeWidth: showSmallDots ? 0 : 3,
            }}
            // stroke-brand-200
            activeDot={{
              fill: "#7dd3fc",
              stroke: "#7dd3fc",
              strokeWidth: showSmallDots ? 1 : 4,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
