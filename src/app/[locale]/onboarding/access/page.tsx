"use client";

import { useTranslation } from "~/i18n/client";
import Methods from "./_components/Methods";
import { useEffectOnce } from "react-use";
import { useAtom } from "jotai";
import { configAtom } from "~/stores";
import { defu } from "defu";

export default function Page() {
  const { t } = useTranslation();
  const [config, setConfig] = useAtom(configAtom);

  useEffectOnce(() => {
    setConfig(
      defu(
        {
          goToOnboardingAccess: true,
        },
        config
      )
    );
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.access.title")}
        </h1>
        <p className="mt-2 text-gray-400">
          {t("onboarding.access.description")}
        </p>
      </div>
      <Methods />
      <div className="max-w-xs text-center">
        <p className="text-gray-400">{t("onboarding.shared.30DaysDelay")}</p>
      </div>
    </div>
  );
}
