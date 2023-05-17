import Section from "~/components/Section";
import StatCard from "~/components/data/StatCard";
import SimpleBarChart from "~/components/data/SimpleBarChart";

const CHART_DATA = [
  {
    label: "12 AM",
    value: 125,
  },
  {
    label: "3 AM",
    value: 2,
  },
  {
    label: "6 AM",
    value: 753,
  },
  {
    label: "9 AM",
    value: 1864,
  },
  {
    label: "12 PM",
    value: 1803,
  },
  {
    label: "3 PM",
    value: 475,
  },
  {
    label: "6 PM",
    value: 3574,
  },
  {
    label: "9 PM",
    value: 2756,
  },
];

function Chart() {
  return (
    <SimpleBarChart data={CHART_DATA} className="px-2" legend="Messages sent" />
  );
}

const STATS_DATA = [
  {
    value: "1h43",
    label: "average time spent per day",
  },
  {
    value: "15",
    label: "Discord app openings per day",
  },
];

function Stats() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 px-2">
      {STATS_DATA.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}

export default function SendingTimes() {
  return (
    <Section title="Sending times" id="sending-times">
      <Chart />
      <Stats />
    </Section>
  );
}
