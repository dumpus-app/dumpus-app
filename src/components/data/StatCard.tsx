import React from "react";
import clsx from "clsx";

export type Props = {
  value: string | React.ReactNode;
  label: string | React.ReactNode;
  className?: string;
};

export default function StatCard({ value, label, className }: Props) {
  return (
    <div className={clsx("rounded-lg bg-gray-900 p-2", className)}>
      {typeof value === "string" ? (
        <div className="font-semibold text-brand-300">{value}</div>
      ) : (
        value
      )}
      {typeof label === "string" ? (
        <div className="text-sm text-gray-50">{label}</div>
      ) : (
        label
      )}
    </div>
  );
}
