"use client";

import { Tab } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "~/i18n/client";
import StepImage from "./_components/StepImage";
import useTranslationData from "./_hooks/use-translation-data";
import { OS } from "~/constants";
import clsx from "clsx";

const defaultOS = OS === "web" ? "desktop" : OS;

const isiOS =
  process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile" && defaultOS === "ios";

export default function Page() {
  const { t } = useTranslation();

  const data = useTranslationData();

  const [selectedIndex, setSelectedIndex] = useState(
    data.findIndex((e) => e.os === defaultOS),
  );

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.setup.title")}
        </h1>
        <p className={clsx("mt-2 text-gray-400", isiOS && "hidden")}>
          {t("onboarding.setup.description")}
        </p>
      </div>
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List
          className={clsx(
            "justify-center space-x-2",
            isiOS ? "hidden" : "flex",
          )}
        >
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
