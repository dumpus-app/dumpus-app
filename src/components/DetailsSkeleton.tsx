import clsx from "clsx";
import { useTranslation } from "~/i18n/client";
import ProfileHeader from "./ProfileHeader";
import Skeleton from "./Skeleton";

/**
 * Placed and sized like a details page's header, stat cards and chart, so
 * nothing jumps when they arrive.
 */
export default function DetailsSkeleton({
  header,
  roundImage = false,
  stats,
}: {
  /** The page's own header, so its back link works during the wait. */
  header?: React.ReactNode;
  roundImage?: boolean;
  stats: number;
}) {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex grow flex-col">
      <span className="sr-only">{t("global.loading.title")}</span>
      {header}
      <ProfileHeader
        description={<Skeleton className="my-1 h-4 w-24 sm:my-1.5 sm:h-5" />}
        title={<Skeleton className="my-1 h-5 w-40 sm:my-1.5 sm:h-6" />}
        imageSlot={
          <Skeleton
            className={clsx(
              "h-16 w-16 sm:h-32 sm:w-32",
              roundImage ? "rounded-full" : "rounded-lg",
            )}
          />
        }
      />
      <div className="desktop-container grid grid-cols-2 gap-2 px-2 py-4 sm:py-8">
        {Array.from({ length: stats }, (_, i) => (
          <div
            key={i}
            className="rounded-lg bg-gray-900 p-2 sm:min-w-32 sm:p-4"
          >
            <Skeleton className="my-1 h-4 w-16 sm:my-1.5 sm:h-6" />
            <Skeleton className="my-0.5 h-4 w-28 opacity-60 sm:my-1 sm:h-5" />
          </div>
        ))}
      </div>
      <div className="desktop-container py-4 sm:py-8">
        <Skeleton className="mx-2 mb-2 h-6 w-36 sm:h-8" />
        <div className="mx-2 h-48 animate-pulse rounded-lg bg-gray-900 sm:h-72" />
      </div>
    </div>
  );
}
