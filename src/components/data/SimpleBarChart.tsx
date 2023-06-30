"use client";

import clsx from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shuffleArray, tailwindColors } from "~/utils";
import { formatNumber } from "~/utils/format";

export type Props = {
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
  legend: string;
  monochrome?: boolean;
};

const COLORS = shuffleArray(tailwindColors);
const COLORS_LENGTH = COLORS.length;

export default function SimpleBarChart({
  data,
  className,
  legend,
  monochrome = true,
}: Props) {
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
          >
            {!monochrome &&
              data.map((entry, i) => {
                const colorObject = COLORS[Math.abs(i) % COLORS_LENGTH];
                const color = colorObject[300];
                return (
                  <Cell
                    key={`cell-${i}`}
                    fill={color}
                    // stroke-gray-950
                    // stroke="#020617"
                    strokeWidth={2}
                    className="focus:outline-none"
                  />
                );
              })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
