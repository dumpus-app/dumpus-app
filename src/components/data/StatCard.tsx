import React from "react";
import clsx from "clsx";

export type Props = {
  value: string;
  label: string;
  className?: string;
};

export default function StatCard({ value, label, className }: Props) {
  return (
    <div className={clsx("rounded-lg bg-gray-900 p-2", className)}>
      <div className="font-semibold text-brand-300">{value}</div>
      <div className="text-sm text-gray-50">{label}</div>
    </div>
  );
}
