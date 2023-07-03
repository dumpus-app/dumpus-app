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
  const { usePerOs, notificationClicked, captchaServed, emailReceived, loginSuccessful, userAvatarUpdated, appCrashed, oauth2Authorized, voiceMessageRecorded, messageReported, messageEdited, nitroAds } =
    useUsageStatsData();
  const { t } = useTranslation();

  console.log((usePerOs() || []).map((os, i) => ({ value: os.count, label: os.os })))

  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-4 desktop-container sm:grid-cols-3 sm:py-8 md:grid-cols-4">
        <StatCard value={formatNumber(notificationClicked(), { notation: 'standard' })} label="notifications clicked" />
        <StatCard value={formatNumber(captchaServed(), { notation: 'standard' })} label="captcha completed" />
        <StatCard value={formatNumber(emailReceived(), { notation: 'standard' })} label="emails received" />
        <StatCard value={formatNumber(loginSuccessful(), { notation: 'standard' })} label="logins successful" />
        <StatCard value={formatNumber(userAvatarUpdated(), { notation: 'standard' })} label="avatar updates" />
        <StatCard value={formatNumber(appCrashed(), { notation: 'standard' })} label="crashes" />
        <StatCard value={formatNumber(oauth2Authorized(), { notation: 'standard' })} label="oauth2 authorized" />
        <StatCard value={formatNumber(voiceMessageRecorded(), { notation: 'standard' })} label="voice messages recorded" />
        <StatCard value={formatNumber(messageReported(), { notation: 'standard' })} label="messages reported" />
        <StatCard value={formatNumber(messageEdited(), { notation: 'standard' })} label="messages edited" />
        <StatCard value={formatNumber(nitroAds(), { notation: 'standard' })} label="seen nitro ads" />
    </div>
  );
}
