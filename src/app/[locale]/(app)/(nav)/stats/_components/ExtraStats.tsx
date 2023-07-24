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
  CursorArrowRippleIcon,
} from "@heroicons/react/24/solid";
import DetailCard from "~/components/data/DetailCard";
import SimplePieChart from "~/components/data/PieChart";
import StatCard from "~/components/data/StatCard";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { useTranslation } from "~/i18n/client";
import { useSelectedPackage } from "~/stores";
import type { Icon } from "~/types";
import {
  formatHour,
  formatMoney,
  formatNumber,
  formatDuration,
} from "~/utils/format";

export default function Stats() {
  const {
    usePerOs,
    notificationClicked,
    captchaServed,
    emailReceived,
    loginSuccessful,
    userAvatarUpdated,
    appCrashed,
    oauth2Authorized,
    voiceMessageRecorded,
    messageReported,
    messageEdited,
    nitroAds,
    timeSpentVoice,
  } = useUsageStatsData();
  const { t } = useTranslation();
  const { package_is_partial } = useSelectedPackage();

  console.log(
    (usePerOs() || []).map((os, i) => ({ value: os.count, label: os.os })),
  );

  if (package_is_partial) return null;

  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-4 desktop-container sm:grid-cols-3 sm:py-8 md:grid-cols-4">
      <StatCard
        value={formatNumber(notificationClicked(), { notation: "standard" })}
        label={t("stats.extra.clickedNotifications")}
      />
      <StatCard
        value={formatNumber(captchaServed(), { notation: "standard" })}
        label={t("stats.extra.completedCaptcha")}
      />
      <StatCard
        value={formatNumber(emailReceived(), { notation: "standard" })}
        label={t("stats.extra.receivedEmail")}
      />
      <StatCard
        value={formatNumber(loginSuccessful(), { notation: "standard" })}
        label={t("stats.extra.successfulLogin")}
      />
      <StatCard
        value={formatNumber(userAvatarUpdated(), { notation: "standard" })}
        label={t("stats.extra.avatarUpdates")}
      />
      <StatCard
        value={formatNumber(appCrashed(), { notation: "standard" })}
        label={t("stats.extra.crashes")}
      />
      <StatCard
        value={formatNumber(oauth2Authorized(), { notation: "standard" })}
        label={t("stats.extra.authorizedOauth2")}
      />
      <StatCard
        value={formatNumber(voiceMessageRecorded(), { notation: "standard" })}
        label={t("stats.extra.voiceMessagesRecorded")}
      />
      <StatCard
        value={formatNumber(messageReported(), { notation: "standard" })}
        label={t("stats.extra.reportedMessages")}
      />
      <StatCard
        value={formatNumber(messageEdited(), { notation: "standard" })}
        label={t("stats.extra.editedMessages")}
      />
      <StatCard
        value={formatNumber(nitroAds(), { notation: "standard" })}
        label={t("stats.extra.seenNitroAds")}
      />
      <StatCard
        value={formatDuration(timeSpentVoice())}
        label={t("stats.extra.spentInVoiceChannels")}
      />
    </div>
  );
}
