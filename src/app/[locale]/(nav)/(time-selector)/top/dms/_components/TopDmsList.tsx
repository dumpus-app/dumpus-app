"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import DetailCard from "~/components/data/DetailCard";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import { avatarURLFallback } from "~/utils/discord";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { timeRangeAtom } from "~/stores/db";
import NoDataAvailable from "~/components/NoDataAvailable";

export default function TopDMsList() {
  const { getData, count } = useTopDMsData();

  const timeRange = useAtomValue(timeRangeAtom);

  const { data: queryData, fetchNextPage } = useInfiniteQuery({
    queryKey: ["top-dms", timeRange],
    queryFn: ({ pageParam = 0 }) => getData({ offset: pageParam })!,
    getNextPageParam: (lastPage, pages) => pages.length,
  });

  if (!count) return <NoDataAvailable />;

  const data = queryData?.pages.flat() || getData({})!;

  return (
    <div className="px-2 py-4 desktop-container sm:py-8">
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((dm) => (
          <DetailCard.WithRank
            key={dm.rank}
            href={`/top/dms/details?id=${dm.dm_user_id}`}
            rank={dm.rank}
            title={dm.user_name}
            description={
              Intl.NumberFormat(i18next.language, {
                notation: "compact",
              }).format(dm.message_count) + " messages sent"
            }
            leftSlot={
              <div className="relative aspect-square w-10">
                <Image
                  src={avatarURLFallback(dm.user_avatar_url, dm.dm_user_id)}
                  alt={`${dm.user_name}'s avatar`}
                  fill
                  className="rounded-full object-cover object-center"
                />
              </div>
            }
            rightIcon={ChevronRightIcon}
          />
        ))}
      </div>
      {data.length < count && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="text-brand-300 hover:underline"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
