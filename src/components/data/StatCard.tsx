import React from "react";
import clsx from "clsx";

export type Props = {
  value: string | React.ReactNode;
  label: string | React.ReactNode;
  className?: string;
};

export default function StatCard({ value, label, className }: Props) {
  return (
    <div
      className={clsx(
        "rounded-lg bg-gray-900 p-2 sm:min-w-[theme('spacing.32')] sm:p-4",
        className,
      )}
    >
      {typeof value === "string" ? (
        <div className="font-semibold text-brand-300 sm:text-3xl">{value}</div>
      ) : (
        value
      )}
      {typeof label === "string" ? (
        <div className="text-sm text-gray-50 sm:text-lg">{label}</div>
      ) : (
        label
      )}
    </div>
  );
}
