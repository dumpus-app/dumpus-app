"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Section from "~/components/Section";
import DetailCard from "~/components/data/DetailCard";
import { formatDate } from "~/utils/format";

const DATA = [
  {
    channel: "#chat",
    date: "2023-01-01T02:45Z",
    message: "Hey everyone, how is it going?",
  },
  {
    channel: "#general",
    date: "2023-01-01T02:48Z",
    message:
      "So glad I found this server. What games are you playing rn? So curious!!!!!!!!",
  },
].map((msg, i) => ({ ...msg, rank: i + 1 }));

export default function FirstMessages() {
  return (
    <Section title="Your first messages">
      <div className="grid grid-cols-1 gap-2 px-2">
        {DATA.map((msg) => (
          <DetailCard.WithRank
            key={msg.rank}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // TODO: bottom sheet
              alert(msg.message);
            }}
            rank={msg.rank}
            title={msg.message}
            description={`${msg.channel} · ${formatDate(msg.date)}`}
            rightIcon={ChevronRightIcon}
            reverseTexts
          />
        ))}
      </div>
    </Section>
  );
}
