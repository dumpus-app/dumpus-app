"use client";

import { useState } from "react";
import { useMount } from "react-use";
import useGenerateImg from "~/hooks/use-generate-img";
import Image from "next/image";
import useUserData from "~/hooks/data/use-user-data";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatNumber } from "~/utils/format";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import { avatarURLFallback } from "~/utils/discord";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";

export default function Test() {
  const { init, generate, initialized } = useGenerateImg();
  const [url, setUrl] = useState<string>();
  const [file, setFile] = useState<File>();

  const data = useUserData();
  const { messageCount } = useUsageStatsData();
  const { getData: getDMsData } = useTopDMsData();
  const { getData: getGuildsData } = useTopGuildsData();

  const genData = {
    user: {
      displayName: data.package_owner_display_name,
      avatarURL: data.package_owner_avatar_url,
    },
    stats: {
      messagesSent: formatNumber(messageCount(), { notation: "standard" }),
      timeSpent: "N/A",
      appOpenings: "N/A",
      otherStat: "N/A",
    },
    topDMS: (getDMsData({}) || []).slice(0, 3).map((dm) => {
      return {
        name: dm.user_name,
        // TODO: get latest url
        url: avatarURLFallback(dm.user_avatar_url, dm.dm_user_id),
      };
    }),
    topGuilds: (getGuildsData({}) || []).slice(0, 3).map((guild) => {
      return {
        name: guild.guild_name,
        url: "https://cdn.discordapp.com/embed/avatars/0.png",
      };
    }),
  };

  useMount(() => init());

  async function gen() {
    const { svgURL, file } = await generate(genData);
    setUrl(svgURL);
    setFile(file);
  }

  return (
    <div>
      <div>GENERATE</div>
      <pre>{JSON.stringify(genData, null, 2)}</pre>
      <button onClick={() => gen()}>
        {initialized ? "Generate" : "Initializing..."}
      </button>
      <div className="relative aspect-[1200/627] h-[80vh] border border-[red]">
        <Image
          src={url || ""}
          alt={``}
          fill
          className="bg-brand-300 object-cover object-center"
        />
      </div>
      {url && file && (
        <button
          onClick={() => {
            navigator.share({
              text: "This is a test!",
              title: "Dumpus",
              url: window.location.href,
              files: [file],
            });
          }}
        >
          share
        </button>
      )}
    </div>
  );
}
