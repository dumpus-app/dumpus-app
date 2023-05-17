import StatCard from "~/components/data/StatCard";

const DATA = [
  { value: "75", label: "server joined" },
  { value: "369", label: "received calls" },
  { value: "845", label: "opened notifs." },
  { value: "2 AM", label: "top hour" },
  { value: "48", label: "network size" },
  { value: "$69", label: "spent" },
];

export default function Stats() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-4">
      {DATA.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
