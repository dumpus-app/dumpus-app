"use client";

import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import useOS, { type OS } from "~/hooks/use-os";
import type { Icon } from "~/types";
import { Tab } from "@headlessui/react";
import Image from "next/image";
import { SimpleIconsAndroid, SimpleIconsIos } from "~/components/icons";
import { useTranslation } from "~/i18n/client";
import ImageZoom from "~/components/ImageZoom";

const icons: Record<OS, Icon> = {
  android: SimpleIconsAndroid,
  ios: SimpleIconsIos,
  desktop: ComputerDesktopIcon,
};

export default function Page() {
  const { t } = useTranslation();
  const os = useOS();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const data = useMemo(() => {
    const rawData = t("onboarding.setup.data", {
      returnObjects: true,
    });
    return (Object.keys(rawData) as OS[]).map((key) => {
      return { ...rawData[key], key, icon: icons[key] };
    });
  }, [t]);

  useEffect(() => {
    setSelectedIndex(data.findIndex((e) => e.key === os));
  }, [data, os]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.setup.title")}
        </h1>
        <p className="mt-2 text-gray-400">
          {t("onboarding.setup.description")}
        </p>
      </div>
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex justify-center space-x-2">
          {data.map(({ key, display, icon: Icon }) => (
            <Tab
              key={key}
              className="flex aspect-square h-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-900 p-2 text-gray-400 data-[headlessui-state='selected']:text-brand-300"
            >
              <Icon className="h-12 w-12" />
              <div>{display}</div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-8 w-full">
          {data.map(({ key, steps }) => (
            <Tab.Panel key={key} className="space-y-4">
              {steps.map(({ name, image }, i) => (
                <div
                  key={`${key}-${i}`}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex aspect-square h-8 items-center justify-center rounded-full bg-brand-300 font-bold text-gray-950">
                    {i + 1}
                  </div>
                  <div className="text-lg font-bold text-white">{name}</div>
                  <div className="relative aspect-video w-full">
                    <ImageZoom>
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="rounded-lg border-2 border-gray-700 bg-brand-950 object-cover object-center"
                      />
                    </ImageZoom>
                  </div>
                </div>
              ))}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
      <div className="max-w-xs text-center">
        <p className="text-gray-400">{t("onboarding.shared.30DaysDelay")}</p>
      </div>
    </div>
  );
}
