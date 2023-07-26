import { SparklesIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useTranslation } from "~/i18n/client";

export default function PremiumBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full bg-yellow-300 px-2 py-0.5 text-sm font-medium text-gold-800",
        className,
      )}
    >
      <SparklesIcon className="-ml-0.5 mr-1 h-3 w-3" />
      <span>{t("premium.premium")}</span>
    </div>
  );
}
