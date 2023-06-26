import StatCard from "~/components/data/StatCard";

export default function Stats({
  messageCount,
  invitesCount,
  topHour,
  reactionCount,
  channelOpenings,
}: {
  messageCount: string;
  invitesCount: string;
  topHour: string;
  reactionCount: string;
  channelOpenings: string;
}) {
  const data = [
    {
      value: messageCount,
      label: "total messages sent",
    },
    {
      value: invitesCount,
      label: "invites created",
    },
    {
      value: topHour,
      label: "top chat hour",
    },
    {
      value: reactionCount,
      label: "reactions added",
    },
    {
      value: channelOpenings,
      label: "channel openings",
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
