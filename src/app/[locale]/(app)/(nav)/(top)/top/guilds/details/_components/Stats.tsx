"use client";

import StatCard from "~/components/data/StatCard";
import { useTranslation } from "~/i18n/client";

export default function Stats({
  messagesCount,
  invitesCount,
  joinsCount,
  topChatHour,
}: {
  messagesCount: string;
  invitesCount: string;
  joinsCount: string;
  topChatHour: string;
}) {
  const { t } = useTranslation();

  const data = [
    {
      value: messagesCount,
      label: t("stats.totalMessagesSent"),
    },
    /*{
      value: invitesCount,
      label: "invites created",
    },*/
    {
      value: joinsCount,
      label: t("stats.guildJoins"),
    },
    {
      value: topChatHour,
      label: t("stats.topChatHour"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-4 desktop-container sm:py-8">
      {data.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
