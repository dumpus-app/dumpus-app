import StatCard from "~/components/data/StatCard";
import { useTranslation } from "~/i18n/client";

export default function Stats({
  messagesCount,
  topChatHour,
  reactionsCount,
}: {
  messagesCount: string;
  topChatHour: string;
  reactionsCount: string;
}) {
  const { t } = useTranslation();

  const data = [
    {
      value: messagesCount,
      label: t("stats.totalMessagesSent"),
    },
    {
      value: topChatHour,
      label: t("stats.topChatHour"),
    },
    {
      value: reactionsCount,
      label: t("stats.reactionsAdded"),
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
