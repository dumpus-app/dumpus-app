"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import DetailCard from "~/components/data/DetailCard";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useWidgetAPI from "~/hooks/use-widget-api";
import { timeRangeAtom } from "~/stores/db";
import Image from "next/image";
import { iconColor } from "~/utils/discord";
import NoDataAvailable from "~/components/NoDataAvailable";
import { formatNumber } from "~/utils/format";

function GuildCard({
  guild,
}: {
  guild: NonNullable<
    ReturnType<ReturnType<typeof useTopGuildsData>["getData"]>
  >[0];
}) {
  const { getGuild } = useWidgetAPI({});

  const { isSuccess, data } = useQuery({
    queryKey: ["widget", guild.guild_id],
    queryFn: () => getGuild({ id: guild.guild_id }),
    staleTime: Infinity,
  });

  return (
    <DetailCard.WithRank
      href={`/top/guilds/details?id=${guild.guild_id}`}
      rank={guild.rank}
      title={guild.guild_name}
      description={`${formatNumber(guild.message_count)} messages sent`}
      leftSlot={
        isSuccess && data.error === undefined ? (
          <div className="relative aspect-square w-10">
            <Image
              src={data.icon_url}
              alt={`${data.name}'s avatar`}
              fill
              className="rounded-lg object-cover object-center"
            />
          </div>
        ) : (
          <div
            className="relative flex aspect-square w-10 items-center justify-center rounded-lg text-2xl font-bold uppercase text-gray-950"
            style={{
              backgroundColor: iconColor(guild.guild_id),
            }}
          >
            <div>{guild.guild_name[0]}</div>
          </div>
        )
      }
      rightIcon={ChevronRightIcon}
    />
  );
}

export default function TopGuildsList() {
  const { getData, count } = useTopGuildsData();
  const timeRange = useAtomValue(timeRangeAtom);

  const { data: queryData, fetchNextPage } = useInfiniteQuery({
    queryKey: ["top-guilds", timeRange],
    queryFn: ({ pageParam = 0 }) => getData({ offset: pageParam })!,
    getNextPageParam: (lastPage, pages) => pages.length,
  });

  if (!count) return <NoDataAvailable />;

  const data = queryData?.pages.flat() || getData({})!;

  return (
    <div className="px-2 py-4 desktop-container sm:py-8">
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((guild) => (
          <GuildCard key={guild.rank} guild={guild} />
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
