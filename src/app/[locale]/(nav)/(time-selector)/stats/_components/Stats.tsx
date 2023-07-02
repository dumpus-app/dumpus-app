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
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { useTranslation } from "~/i18n/client";
import type { Icon } from "~/types";
import { formatHour, formatMoney, formatNumber, formatDuration } from "~/utils/format";

export default function Stats() {
  const { networkSize, joinedGuilds, topHour, spentMoney, appStarted, avgAppStartedPerDay, messageCount, avgMessageCountPerDay, avgSessionDuration } =
    useUsageStatsData();
  const { t } = useTranslation();

  const data: {
    value: string;
    title: string;
    description: string;
    icon: Icon;
  }[] = [
    {
      value: formatNumber(messageCount, { notation: "standard" }),
      title: t("stats.messagesSent"),
      description: t("stats.messagesSentPerDay", { value: avgMessageCountPerDay }),
      icon: ChatBubbleBottomCenterTextIcon
    },
    {
      value: formatNumber(joinedGuilds),
      title: t("stats.joinedServers"),
      description: t("stats.joinedServersDesc"),
      icon: ArrowLeftOnRectangleIcon,
    },/*
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
    },*/
    {
      value: formatNumber(networkSize),
      title: t("stats.knownUsers"),
      description: t("stats.knownUsersDesc"),
      icon: UsersIcon,
    },
    {
      value: formatMoney(spentMoney || 0),
      title: t("stats.spentMoney"),
      // TODO: fix this more properly (context is not working because of keyof)
      // @ts-ignore
      description: t("stats.spentMoneyDesc", { context: (spentMoney || 0) > 0 ? 'positive' : 'empty' }),
      icon: BanknotesIcon,
    },
    {
      value: formatNumber(appStarted, { notation: "standard" }),
      title: t("stats.appStarts"),
      description: t("stats.appStartsPerDay", { value: avgAppStartedPerDay }),
      icon: CursorArrowRippleIcon,
    },
    {
      value: formatDuration((avgSessionDuration || 0) * 60_000),
      title: t("stats.totalTimeSpent"),
      description: t("stats.avgSessionTime", { value: formatDuration(12) }),
      icon: CursorArrowRippleIcon,
    }
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
