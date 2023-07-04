"use client";

import { Dialog, Transition } from "@headlessui/react";
import { useAtom } from "jotai";
import Button from "~/components/Button";
import { generatingShareImageAtom, showSharePopupAtom } from "~/stores/ui";
import { useState, Fragment, useEffect } from "react";
import useGenerateImg from "~/hooks/use-generate-img";
import Image from "next/image";
import useUserData from "~/hooks/data/use-user-data";
import useUsageStatsData from "~/hooks/data/use-usage-stats-data";
import { formatNumber } from "~/utils/format";
import useTopDMsData from "~/hooks/data/use-top-dms-data";
import { avatarURLFallback } from "~/utils/discord";
import useTopGuildsData from "~/hooks/data/use-top-guilds-data";
import { BASE_URL } from "~/constants";

export default function SharePopup() {
  const [open, setOpen] = useAtom(showSharePopupAtom);
  const [generatingShareImage, setGeneratingShareImage] = useAtom(
    generatingShareImageAtom
  );

  const { init, generate } = useGenerateImg();
  const [url, setUrl] = useState<string>();
  const [file, setFile] = useState<File>();

  const data = useUserData();
  const { messageCount } = useUsageStatsData();
  const { getData: getDMsData } = useTopDMsData();
  const { getData: getGuildsData } = useTopGuildsData();

  useEffect(() => {
    if (!open || !generatingShareImage) return;

    async function gen() {
      const { svgURL, file } = await generate({
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
      });
      setUrl(svgURL);
      setFile(file);
      setGeneratingShareImage(false);
    }

    init().then(() => {
      gen();
    });
  }, [
    data.package_owner_avatar_url,
    data.package_owner_display_name,
    generate,
    generatingShareImage,
    getDMsData,
    getGuildsData,
    init,
    messageCount,
    open,
    setGeneratingShareImage,
  ]);

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

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
                  <div className="relative aspect-[1200/627] w-full">
                    {url ? (
                      <Image
                        src={url || ""}
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
                      Share your recap
                    </Dialog.Title>
                    <div className="space-y-2 px-4 text-base text-gray-400">
                      <p className="mt-2 text-gray-400">
                        Using your own server allows you to skip the queue.
                        Financial supporters can also skip as a token of
                        appreciation.
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
                        files: [file!],
                      });
                    } catch (err) {
                      const a = document.createElement("a");
                      document.body.appendChild(a);
                      a.setAttribute("style", "display: none");
                      a.setAttribute("href", url!);
                      a.download = "dumpus-share.png";
                      a.click();
                      a.remove();
                    }
                    setOpen(false);
                  }}
                  disabled={generatingShareImage}
                >
                  {generatingShareImage ? "Generating..." : "Share!"}
                </Button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
