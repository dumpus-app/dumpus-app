"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import NoDataAvailable from "~/components/NoDataAvailable";
import DetailCard from "~/components/data/DetailCard";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useUserDetails from "~/hooks/use-user-details";
import { useConfigStore } from "~/stores/config";
import { avatarURLFallback } from "~/utils/discord";
import { formatNumber } from "~/utils/format";
import LoadMore from "../../_components/LoadMore";

function DMCard({
  dm,
}: {
  dm: NonNullable<ReturnType<ReturnType<typeof useTopDMsData>["getData"]>>[0];
}) {
  const data = useUserDetails({ userID: dm.dm_user_id });

  const username = dm.user_name;
  const displayName = data?.display_name || username;
  const avatarURL = data?.avatar_url || dm.user_avatar_url;

  return (
    <DetailCard.WithRank
      href={`/top/dms/details?id=${dm.dm_user_id}`}
      rank={dm.rank}
      title={displayName}
      description={`${formatNumber(dm.message_count)} messages sent`}
      leftSlot={
        <div className="relative aspect-square w-10">
          <Image
            src={avatarURLFallback(avatarURL, dm.dm_user_id)}
            alt={`${username}'s avatar`}
            fill
            className="rounded-full object-cover object-center"
          />
        </div>
      }
      rightIcon={ChevronRightIcon}
    />
  );
}

export default function TopDMsList() {
  const { getData, count } = useTopDMsData();

  const timeRange = useConfigStore((state) => state.timeRange);

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
          <DMCard key={dm.rank} dm={dm} />
        ))}
      </div>
      {data.length < count && <LoadMore loadMore={fetchNextPage} />}
    </div>
  );
}
