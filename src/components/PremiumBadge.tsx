import { SparklesIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import type { Icon } from "~/types";

export default function PremiumBadge({
  className,
  text,
  icon: Icon = SparklesIcon,
}: {
  className?: string;
  text: string;
  icon?: Icon;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full bg-yellow-300 px-2 py-0.5 text-sm font-medium text-gold-800",
        className,
      )}
    >
      <Icon className="-ml-0.5 mr-1 h-3 w-3" />
      <span>{text}</span>
    </div>
  );
}
