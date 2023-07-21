import { useTranslation } from "~/i18n/client";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { PackageAPIStatusResponse } from "~/types/package-api";
import Retry from "./Retry";

export default function Progress({ data }: { data: PackageAPIStatusResponse }) {
  const { t } = useTranslation();
  const { processingStep, isErrored } = data;
  /**
   * 0 Downloading
   * 1 Analyzing
   * 2 Setup DB
   */
  const currentStep = (() => {
    switch (processingStep) {
      case "LOCKED":
      case "DOWNLOADING":
        return 0;
      case "ANALYZING":
        return 1;
      case "PROCESSED":
        return 2;
    }
  })();

  const errorStep = isErrored ? currentStep : null
  
  const steps = [
    t("onboarding.loading.progress.downloading"),
    t("onboarding.loading.progress.analyzing"),
    t("onboarding.loading.progress.processed"),
  ];

  return (
    <>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const valid = currentStep >= i;
          const hasError = i === errorStep;
          const Icon = hasError ? XCircleIcon : CheckCircleIcon;
          return (
            <div key={i} className="flex items-center space-x-2">
              {valid ? (
                <Icon
                  className={clsx(
                    "h-6 w-6",
                    hasError ? "text-danger-300" : "text-brand-300"
                  )}
                />
              ) : (
                <div className="ml-[2.5px] h-5 w-5 rounded-full border-2 border-gray-400" />
              )}
              <div
                className={clsx(
                  "text-lg",
                  valid ? "font-medium text-white" : "text-gray-400"
                )}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
      <Retry show={errorStep !== null} />
    </>
  );
}
