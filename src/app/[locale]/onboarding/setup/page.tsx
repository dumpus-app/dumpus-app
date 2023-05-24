"use client";

import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import useOS from "~/hooks/use-os";
import type { Icon } from "~/types";
import { Tab } from "@headlessui/react";
import Image from "next/image";
import { SimpleIconsAndroid, SimpleIconsIos } from "~/components/icons";

type Step = {
  name: string;
  image: string;
};

const tabs: {
  name: string;
  icon: Icon;
  content: Step[];
}[] = [
  {
    name: "Android",
    icon: SimpleIconsAndroid,
    content: [
      {
        name: "Open your settings android",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
      {
        name: "Open your settings android",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
    ],
  },
  {
    name: "iOS",
    icon: SimpleIconsIos,
    content: [
      {
        name: "Open your settings ios",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
    ],
  },
  {
    name: "Desktop",
    icon: ComputerDesktopIcon,
    content: [
      {
        name: "Open your settings desktop",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
      {
        name: "Open your settings desktop",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
      {
        name: "Open your settings desktop",
        image: "https://florian-lefebvre.dev/images/og-image.jpg",
      },
    ],
  },
];

export default function Page() {
  const os = useOS();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(
      tabs.findIndex((tab) => tab.name.toLocaleLowerCase() === os)
    );
  }, [os]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          How do I get my data package?
        </h1>
        <p className="mt-2 text-gray-400">
          Select an operating system to get started.
        </p>
      </div>
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex justify-center space-x-2">
          {tabs.map(({ name, icon: Icon }) => (
            <Tab
              key={name}
              className="flex aspect-square h-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-900 p-2 text-gray-400 data-[headlessui-state='selected']:text-brand-300"
            >
              <Icon className="h-12 w-12" />
              <div>{name}</div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-8 w-full">
          {tabs.map(({ name, content }) => (
            <Tab.Panel key={name} className="space-y-4">
              {content.map((step, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex aspect-square h-8 items-center justify-center rounded-full bg-brand-300 font-bold text-gray-950">
                    {i + 1}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {step.name}
                  </div>
                  <div className="relative aspect-video w-full">
                    <Image
                      src={step.image}
                      alt={name}
                      fill
                      className="rounded-lg border-2 border-gray-700 bg-brand-950 object-cover object-center"
                    />
                  </div>
                </div>
              ))}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
      <div className="max-w-xs text-center">
        <p className="text-gray-400">
          Keep in mind it can take up to 30 days to receive the email. Be
          patient!
        </p>
      </div>
    </div>
  );
}
