"use client";

import StatCard from "~/components/data/StatCard";

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
  const data = [
    {
      value: messagesCount,
      label: "total messages sent",
    },
    /*{
      value: invitesCount,
      label: "invites created",
    },*/
    {
      value: joinsCount,
      label: "guild joins",
    },
    {
      value: topChatHour,
      label: "top chat hour",
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
