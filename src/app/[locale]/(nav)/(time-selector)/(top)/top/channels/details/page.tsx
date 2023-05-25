"use client";

import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import RelatedGuild from "./_components/RelatedGuild";
import Stats from "./_components/Stats";
import DailySentMessages from "./_components/DailySentMessages";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";

export default function Page() {
  const name = "#chat";

  return (
    <>
      <PageHeader title={name} />
      <ProfileHeader
        description="AndrozDev"
        title={name}
        imageSlot={
          <div className="relative flex aspect-square w-16 shrink-0 items-center justify-center rounded-lg bg-brand-300 text-4xl font-bold uppercase text-gray-950 sm:h-32 sm:w-32 sm:text-6xl">
            <div>{name[1]}</div>
          </div>
        }
      >
        <Header.Icon
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          target="_blank"
          noI18n
          icon={SimpleIconsDiscord}
          className="absolute right-2 top-4 hidden sm:block"
        />
      </ProfileHeader>
      <RelatedGuild />
      <Stats />
      <DailySentMessages />
    </>
  );
}
