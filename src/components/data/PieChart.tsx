"use client";

import clsx from "clsx";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { shuffleArray, tailwindColors } from "~/utils";

export type Props = {
  data: {
    label: string;
    value: number;
  }[];
  className?: string;
  legend: string;
};

const COLORS = shuffleArray(tailwindColors);
const COLORS_LENGTH = COLORS.length;

export default function SimplePieChart({ data, className, legend }: Props) {
  const [focusedIndex, setFocusedIndex] = useState<number>();

  return (
    <div
      className={clsx(
        "relative aspect-square h-48 overflow-hidden sm:h-72",
        className
      )}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-sm text-gray-400">
          {focusedIndex ? data[focusedIndex].label : ""}
        </div>
        <div className="text-base text-white">
          {focusedIndex ? data[focusedIndex].value : ""}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          onClick={(e) => {
            console.log("click");
          }}
        >
          {/* <Legend /> */}
          <Pie
            data={data}
            // name={legend}
            // nameKey="label"
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={50}
            fill="#7dd3fc"
          >
            {data.map((entry, i) => {
              const colorObject = COLORS[Math.abs(i) % COLORS_LENGTH];
              const active = i === focusedIndex;
              const shade = active ? 300 : 300;
              const opacity =
                focusedIndex !== undefined ? (active ? "" : "75") : "";
              const color = colorObject[shade] + opacity;
              return (
                <Cell
                  onFocus={() => setFocusedIndex(i)}
                  key={`cell-${i}`}
                  fill={color}
                  // stroke-gray-950
                  stroke="#020617"
                  strokeWidth={2}
                  className="focus:outline-none"
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
