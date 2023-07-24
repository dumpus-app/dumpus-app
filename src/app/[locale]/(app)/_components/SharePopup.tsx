"use client";

import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Fragment } from "react";
import { shallow } from "zustand/shallow";
import Button from "~/components/Button";
import { BASE_URL } from "~/constants";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import useUserData from "~/hooks/data/use-user-data";
import useGenerateImg from "~/hooks/use-generate-img";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";
import { avatarURLFallback } from "~/utils/discord";
import { formatDuration, formatNumber } from "~/utils/format";

function useImageData() {
  const data = useUserData();
  const { messageCount, totalSessionDuration, appStarted, networkSize } =
    useUsageStatsData();
  const { getData: getDMsData } = useTopDMsData();
  const { getData: getGuildsData } = useTopGuildsData();

  return {
    user: {
      displayName: data.package_owner_display_name,
      avatarURL: data.package_owner_avatar_url.replace(/.webp|.gif/, ".png"),
    },
    stats: {
      messagesSent: formatNumber(messageCount(), { notation: "standard" }),
      timeSpent: formatDuration((totalSessionDuration() || 0) * 60_000),
      appOpenings: formatNumber(appStarted(), { notation: "standard" }),
      networkSize: formatNumber(networkSize(), { notation: "standard" }),
    },
    topDMS: (getDMsData({}) || []).slice(0, 3).map((dm) => {
      return {
        name: dm.user_name,
        // TODO: get latest url
        url: avatarURLFallback(dm.user_avatar_url, dm.dm_user_id).replace(
          /.webp|.gif/,
          ".png"
        ),
        count: formatNumber(dm.message_count),
      };
    }),
    topGuilds: (getGuildsData({}) || []).slice(0, 3).map((guild) => {
      return {
        name: guild.guild_name,
        url: "https://cdn.discordapp.com/embed/avatars/0.png",
        count: formatNumber(guild.message_count),
      };
    }),
  };
}

export default function SharePopup() {
  const { t } = useTranslation();
  const [open, setOpen] = useAppStore(
    ({ ui }) => [ui.showSharePopup, ui.setShowSharePopup],
    shallow
  );

  const imageData = useImageData();

  const { generate, width, height, initialized } = useGenerateImg();

  const { data, status } = useQuery({
    queryKey: ["generate-share-img", imageData],
    queryFn: () => generate(imageData),
    staleTime: Infinity,
    enabled: initialized,
  });

  const canShare = !!navigator.share;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-950 bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 bottom-safe-area-bottom-inset z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-2xl border border-gray-800 bg-gray-900 p-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div>
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: `${width}/${height}` }}
                  >
                    {data ? (
                      <Image
                        src={data.svgURL}
                        alt={``}
                        fill
                        className="rounded-lg object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full rounded-lg bg-gray-800"></div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold text-white sm:text-2xl"
                    >
                      {t("share.recap")}
                    </Dialog.Title>
                    <div className="space-y-2 px-4 text-base text-gray-400">
                      <p className="mt-2 text-gray-400">
                        {t("share.recapDescription")}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="brand"
                  className="mt-4 w-full"
                  onClick={async () => {
                    // TODO: detect os as well
                    try {
                      await navigator.share({
                        title: "Here is my Discord recap!",
                        text: "Generated on https://dumpus.app, try it yourself!",
                        url: BASE_URL,
                        files: [data!.file],
                      });
                    } catch (err: DOMException | any) {
                      if (err.name === "AbortError") {
                        // user aborted share intentionnally
                        return;
                      }
                      console.error(err);
                      const a = document.createElement("a");
                      document.body.appendChild(a);
                      a.setAttribute("style", "display: none");
                      a.setAttribute("href", data!.svgURL);
                      a.download = "dumpus-share.png";
                      a.click();
                      a.remove();
                    }
                    setOpen(false);
                  }}
                  disabled={status !== "success"}
                >
                  {status !== "success"
                    ? t("share.generating")
                    : canShare
                    ? t("share.title")
                    : t("share.download")}
                </Button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
