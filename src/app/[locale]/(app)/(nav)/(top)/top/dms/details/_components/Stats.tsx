import StatCard from "~/components/data/StatCard";

export default function Stats({
  messagesCount,
  topChatHour,
  reactionsCount,
}: {
  messagesCount: string;
  topChatHour: string;
  reactionsCount: string;
}) {
  const data = [
    {
      value: messagesCount,
      label: "total messages sent",
    },
    {
      value: topChatHour,
      label: "top chat hour",
    },
    {
      value: reactionsCount,
      label: "reactions added",
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
