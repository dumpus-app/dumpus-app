"use client";

import Image from "next/image";
import PageHeader from "./_components/PageHeader";
import ProfileHeader from "~/components/ProfileHeader";
import Stats from "./_components/Stats";
import DailySentMessages from "./_components/DailySentMessages";
import Header from "~/components/layout/Header";
import { SimpleIconsDiscord } from "~/components/icons";

export default function Page() {
  const name = "Androz";

  return (
    <>
      <PageHeader title={name} />
      <ProfileHeader
        description="@androz2091"
        title={name}
        imageSlot={
          <div className="relative h-16 w-16 sm:h-32 sm:w-32">
            <Image
              src="https://cdn.discordapp.com/embed/avatars/5.png"
              alt="Avatar"
              fill
              priority
              className="rounded-full object-cover object-center"
            />
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
      <Stats />
      <DailySentMessages />
    </>
  );
}
