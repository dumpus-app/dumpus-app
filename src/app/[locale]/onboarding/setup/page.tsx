"use client";

import { Capacitor } from "@capacitor/core";
import { Tab } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "~/i18n/client";
import StepImage from "./_components/StepImage";
import useTranslationData from "./_hooks/use-translation-data";

const OS = (() => {
  switch (Capacitor.getPlatform()) {
    case "android":
      return "android";
    case "ios":
      return "ios";
    case "web":
    default:
      return "desktop";
  }
})();

export default function Page() {
  const { t } = useTranslation();

  const data = useTranslationData();

  const [selectedIndex, setSelectedIndex] = useState(
    data.findIndex((e) => e.os === OS)
  );

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
          {data.map(({ os, display, icon: Icon }) => (
            <Tab
              key={os}
              className="flex aspect-square h-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-900 p-2 text-gray-400 data-[headlessui-state='selected']:text-brand-300"
            >
              <Icon className="h-12 w-12" />
              <div>{display}</div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-8 w-full">
          {data.map(({ os, steps }) => (
            <Tab.Panel key={os} className="space-y-4 focus:outline-none">
              {steps.map(({ name, image }, i) => (
                <div
                  key={`${os}-${i}`}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex aspect-square h-8 items-center justify-center rounded-full bg-brand-300 font-bold text-gray-950">
                    {i + 1}
                  </div>
                  <div className="text-lg font-bold text-white">{name}</div>
                  <StepImage src={image} alt={name} />
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
