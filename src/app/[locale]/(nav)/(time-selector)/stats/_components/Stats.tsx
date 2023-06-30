"use client";

// https://heroicons.com/

import {
  ArrowLeftOnRectangleIcon,
  BanknotesIcon,
  BellAlertIcon,
  ClockIcon,
  PhoneArrowDownLeftIcon,
  UsersIcon,
  ChatBubbleBottomCenterTextIcon,
  CursorArrowRippleIcon
} from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import type { Icon } from "~/types";
import { formatHour, formatMoney, formatNumber } from "~/utils/format";

export default function Stats() {
  const { networkSize, joinedGuilds, topHour, spentMoney, appStarted, avgAppStartedPerDay, messageCount, avgMessageCountPerDay } =
    useUsageStatsData();

  const data: {
    value: string;
    title: string;
    description: string;
    icon: Icon;
  }[] = [
    {
      value: formatNumber(messageCount, { notation: "standard" }),
      title: "messages sent",
      description: `That's about ${avgMessageCountPerDay} messages per day!`,
      icon: ChatBubbleBottomCenterTextIcon
    },
    {
      value: formatNumber(joinedGuilds),
      title: "distinct server joined",
      description: `You went on ~${((joinedGuilds || 0)*100/19_000_000).toFixed(4)}% of all the servers!`,
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
      description: "You're a night owl!",
      icon: ClockIcon,
    },
    {
      value: formatNumber(networkSize),
      title: "known disctinct users",
      description: "Well, you know a lot of people!",
      icon: UsersIcon,
    },
    {
      value: formatMoney(spentMoney || 0),
      title: "spent",
      description: "That's a lot of cash...!",
      icon: BanknotesIcon,
    },

    {
      value: formatNumber(appStarted, { notation: "standard" }),
      title: "app starts",
      description: `You open Discord about ${avgAppStartedPerDay} times per day!`,
      icon: CursorArrowRippleIcon,
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
