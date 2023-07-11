import { SparklesIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

export default function PremiumBadge({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full bg-yellow-300 px-2 py-0.5 text-sm font-medium text-gold-800",
        className
      )}
    >
      <SparklesIcon className="-ml-0.5 mr-1 h-3 w-3" />
      <span>Premium</span>
    </div>
  );
}
