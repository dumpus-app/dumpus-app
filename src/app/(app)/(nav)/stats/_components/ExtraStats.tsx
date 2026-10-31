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
  // Null is a count the export can't tell, see `carriesEvent`.
  const count = (n: number | null) =>
    n === null ? t("noData") : formatNumber(n, { notation: "standard" });

  console.log(
    (usePerOs() || []).map((os, i) => ({ value: os.count, label: os.os })),
  );

  if (package_is_partial) return null;

  return (
    <div className="desktop-container grid grid-cols-2 gap-2 px-2 py-4 sm:grid-cols-3 sm:py-8 md:grid-cols-4">
      <StatCard
        value={count(notificationClicked())}
        label={t("stats.extra.clickedNotifications")}
      />
      <StatCard
        value={count(captchaServed())}
        label={t("stats.extra.completedCaptcha")}
      />
      <StatCard
        value={count(emailReceived())}
        label={t("stats.extra.receivedEmail")}
      />
      <StatCard
        value={count(loginSuccessful())}
        label={t("stats.extra.successfulLogin")}
      />
      <StatCard
        value={count(userAvatarUpdated())}
        label={t("stats.extra.avatarUpdates")}
      />
      <StatCard value={count(appCrashed())} label={t("stats.extra.crashes")} />
      <StatCard
        value={count(oauth2Authorized())}
        label={t("stats.extra.authorizedOauth2")}
      />
      <StatCard
        value={count(voiceMessageRecorded())}
        label={t("stats.extra.voiceMessagesRecorded")}
      />
      <StatCard
        value={count(messageReported())}
        label={t("stats.extra.reportedMessages")}
      />
      <StatCard
        value={count(messageEdited())}
        label={t("stats.extra.editedMessages")}
      />
      <StatCard
        value={count(nitroAds())}
        label={t("stats.extra.seenNitroAds")}
      />
      <StatCard
        value={formatDuration(timeSpentVoice())}
        label={t("stats.extra.spentInVoiceChannels")}
      />
    </div>
  );
}
