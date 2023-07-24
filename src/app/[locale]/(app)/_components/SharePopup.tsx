"use client";

import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Fragment } from "react";
import { shallow } from "zustand/shallow";
import Button from "~/components/Button";
import { BASE_URL, OS } from "~/constants";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import useUserData from "~/hooks/data/use-user-data";
import useGenerateImg from "~/hooks/use-generate-img";
import useOS from "~/hooks/use-os";
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

function useShare({ canShare }: { canShare: boolean }) {
  const filePath = "images/recap.png";
  const sharedShareData = {
    title: "Here is my Discord recap!",
    text: "Generated on https://dumpus.app, try it yourself!",
    url: BASE_URL,
  };

  async function share({
    webFile,
    imageData,
    url,
  }: Awaited<ReturnType<ReturnType<typeof useGenerateImg>["generate"]>>) {
    if (canShare) {
      if (OS === "web") {
        await navigator.share({
          ...sharedShareData,
          files: [webFile],
        });
        return;
      }

      const sharedOpts = {
        path: filePath,
        directory: Directory.Cache,
      };

      const file = await Filesystem.writeFile({
        data: imageData,
        ...sharedOpts,
        recursive: true,
        encoding: Encoding.UTF8,
      });

      try {
        await Share.share({
          ...sharedShareData,
          dialogTitle: "Share your recap",
          files: [file.uri],
        });
      } catch (err) {
        console.warn("Sharing aborted");
      }

      await Filesystem.deleteFile({ ...sharedOpts });

      return;
    }
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute("style", "display: none");
    a.setAttribute("href", url);
    a.download = "dumpus-share.png";
    a.click();
    a.remove();
  }

  return share;
}

export default function SharePopup() {
  const { t } = useTranslation();
  const [open, setOpen] = useAppStore(
    ({ ui }) => [ui.showSharePopup, ui.setShowSharePopup],
    shallow
  );

  const os = useOS() || OS;
  const canShare = os === "web" ? "share" in navigator : true;

  const imageData = useImageData();

  const {
    generate,
    width,
    height,
    status: generationStatus,
  } = useGenerateImg();

  const share = useShare({ canShare });

  const { data, status } = useQuery({
    queryKey: ["generate-share-img", imageData],
    queryFn: () => generate(imageData),
    staleTime: Infinity,
    enabled: generationStatus === "initialized",
  });

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
                        src={data.url}
                        alt={``}
                        fill
                        className="rounded-lg object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse rounded-lg bg-gray-800"></div>
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
                  onClick={data ? () => share(data) : undefined}
                  disabled={status !== "success"}
                >
                  {(() => {
                    switch (generationStatus) {
                      case "initialized":
                        return (() => {
                          switch (status) {
                            case "success":
                              return canShare
                                ? t("share.title")
                                : t("share.download");
                            case "loading":
                              return t("share.generating");
                            case "error":
                              return "An error occured";
                          }
                        })();
                      case "error":
                        return "An error occured";
                      default:
                        return t("share.generating");
                    }
                  })()}
                </Button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
