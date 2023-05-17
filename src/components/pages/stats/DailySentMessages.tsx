import Section from "~/components/Section";
import SimpleBarChart from "~/components/data/SimpleBarChart";

const DATA = [
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

export default function DailySentMessages() {
  return (
    <Section title="Daily sent messages" id="daily-sent-messages">
      <SimpleBarChart data={DATA} className="px-2" legend="Messages sent" />
    </Section>
  );
}
