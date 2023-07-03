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
import SimplePieChart from "~/components/data/PieChart";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { useTranslation } from "~/i18n/client";
import type { Icon } from "~/types";
import { formatHour, formatMoney, formatNumber, formatDuration } from "~/utils/format";

export default function Stats() {
  const { usePerOs } =
    useUsageStatsData();
  const { t } = useTranslation();

  console.log((usePerOs || []).map((os, i) => ({ value: os.count, label: os.os })))

  return (
    <div className="grid grid-cols-1 gap-2 px-2 py-4 desktop-container sm:grid-cols-2 sm:py-8 md:grid-cols-3">
        <SimplePieChart data={(usePerOs || []).map((os, i) => ({ value: os.count, label: os.os }))} legend="Hour spent on each O.S." />
    </div>
  );
}
