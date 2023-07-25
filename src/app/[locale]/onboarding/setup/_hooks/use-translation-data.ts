"use client";

import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
import i18next from "i18next";
import { useMemo } from "react";
import { SimpleIconsAndroid, SimpleIconsIos } from "~/components/icons";
import { useTranslation } from "~/i18n/client";
import type { Icon } from "~/types";

const icons: Record<string, Icon> = {
  android: SimpleIconsAndroid,
  ios: SimpleIconsIos,
  desktop: ComputerDesktopIcon,
};

type Data = {
  os: string;
  display: string;
  icon: Icon;
  steps: {
    name: string;
    image: string;
  }[];
};

export default function useTranslationData() {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const osDisplays = t("onboarding.setup.osDisplays", {
      returnObjects: true,
    });
    const steps = t("onboarding.setup.steps", { returnObjects: true });
    const data: Data[] = [];
    for (const [os, display] of Object.entries(osDisplays)) {
      const _data: Data = {
        os,
        display,
        icon: icons[os as string],
        steps: [],
      };
      for (const [step, name] of Object.entries(steps)) {
        _data.steps.push({
          name,
          image: `/assets/onboarding/${i18next.language}/${os}/${step}.png`,
        });
      }
      data.push(_data);
    }
    return data;
  }, [t]);

  return data;
}
