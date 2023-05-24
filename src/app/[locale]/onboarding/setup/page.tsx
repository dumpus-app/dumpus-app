"use client";

import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
import { SVGProps, useEffect, useState } from "react";
import useOS, { type OS } from "~/hooks/use-os";
import type { Icon } from "~/types";
import { Tab } from "@headlessui/react";
import Image from "next/image";

type Step = {
  name: string;
  image: string;
};

function SimpleIconsAndroid(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17.523 15.341a1 1 0 0 1 0-1.999a1 1 0 0 1 0 2m-11.046 0a1 1 0 0 1 0-2a1 1 0 0 1 0 2m11.405-6.02l1.997-3.46a.416.416 0 0 0-.152-.567a.416.416 0 0 0-.568.152L17.137 8.95c-1.547-.706-3.284-1.1-5.137-1.1s-3.59.394-5.137 1.1L4.841 5.447a.416.416 0 0 0-.568-.152a.416.416 0 0 0-.152.567l1.997 3.46C2.688 11.186.343 14.658 0 18.76h24c-.344-4.102-2.69-7.574-6.119-9.44"
      ></path>
    </svg>
  );
}

function SimpleIconsIos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M1.1 6.05c-.614 0-1.1.48-1.1 1.08a1.08 1.08 0 0 0 1.1 1.08c.62 0 1.11-.48 1.11-1.08c0-.6-.49-1.08-1.11-1.08m7.61.02c-3.36 0-5.46 2.29-5.46 5.93c0 3.67 2.1 5.95 5.46 5.95c3.34 0 5.45-2.28 5.45-5.95c0-3.64-2.11-5.93-5.45-5.93m10.84 0c-2.5 0-4.28 1.38-4.28 3.43c0 1.63 1.01 2.65 3.13 3.14l1.49.36c1.45.33 2.04.81 2.04 1.64c0 .96-.97 1.64-2.35 1.64c-1.41 0-2.47-.69-2.58-1.75h-2c.08 2.12 1.82 3.42 4.46 3.42c2.79 0 4.54-1.37 4.54-3.55c0-1.71-1-2.68-3.32-3.21l-1.33-.3c-1.41-.34-1.99-.79-1.99-1.55c0-.96.88-1.6 2.18-1.6c1.31 0 2.21.65 2.31 1.72h1.96c-.05-2.02-1.72-3.39-4.26-3.39M8.71 7.82c2.04 0 3.35 1.63 3.35 4.18c0 2.57-1.31 4.2-3.35 4.2c-2.06 0-3.36-1.63-3.36-4.2c0-2.55 1.3-4.18 3.36-4.18M.111 9.31v8.45H2.1V9.31H.11Z"
      ></path>
    </svg>
  );
}

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
        <Tab.Panels className="mt-8">
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
