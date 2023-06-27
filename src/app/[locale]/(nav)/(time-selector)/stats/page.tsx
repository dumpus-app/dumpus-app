"use client";

import PageHeader from "./_components/PageHeader";
import Stats from "./_components/Stats";
import SendingTimes from "./_components/SendingTimes";
import DailySentMessages from "./_components/DailySentMessages";

export default function Page() {
  return (
    <>
      <PageHeader />
      <Stats />
      <SendingTimes />
      <DailySentMessages />
    </>
  );
}
