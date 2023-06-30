"use client";

import {
  ArrowLeftOnRectangleIcon,
  BanknotesIcon,
  BellAlertIcon,
  ClockIcon,
  PhoneArrowDownLeftIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import type { Icon } from "~/types";
import { formatHour, formatMoney, formatNumber } from "~/utils/format";

export default function Stats() {
  const { networkSize, joinedGuilds, topHour, spentMoney } =
    useUsageStatsData();

  const data: {
    value: string;
    title: string;
    description: string;
    icon: Icon;
  }[] = [
    {
      value: formatNumber(joinedGuilds),
      title: "server joined",
      description: "lorem ipsum",
      icon: ArrowLeftOnRectangleIcon,
    },
    {
      value: "N/A",
      title: "received calls",
      description: "lorem ipsum",
      icon: PhoneArrowDownLeftIcon,
    },
    {
      value: "N/A",
      title: "opened notifs.",
      description: "lorem ipsum",
      icon: BellAlertIcon,
    },
    {
      value: formatHour(topHour),
      title: "top hour",
      description: "lorem ipsum",
      icon: ClockIcon,
    },
    {
      value: formatNumber(networkSize),
      title: "network size",
      description: "lorem ipsum",
      icon: UsersIcon,
    },
    {
      value: formatMoney(spentMoney || 0),
      title: "spent",
      description: "lorem ipsum",
      icon: BanknotesIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8 md:grid-cols-3">
      {data.map(({ value, title, description, icon: Icon }, i) => (
        <DetailCard
          key={i}
          leftSlot={<Icon className="h-8 w-8 text-gray-500" />}
          title={
            <>
              <span className="text-brand-300">{value}</span> {title}
            </>
          }
          description={description}
        />
      ))}
    </div>
  );
}
