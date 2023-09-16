import { useTranslation } from "~/i18n/client";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { PackageAPIStatusResponse } from "~/types/package-api";
import Retry from "./Retry";

export default function Progress({
  data,
  importing,
}: {
  data: PackageAPIStatusResponse;
  importing: boolean;
}) {
  const { t } = useTranslation();
  const { processingStep, isErrored } = data;
  /**
   * 0 Downloading
   * 1 Analyzing
   * 2 Processing
   * 3 Import DB
   */
  const currentStep = (() => {
    if (importing) return 3;

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

  const errorStep = isErrored ? currentStep : null;

  const steps = [
    t("onboarding.loading.progress.downloading"),
    t("onboarding.loading.progress.analyzing"),
    t("onboarding.loading.progress.processing"),
    t("onboarding.loading.progress.importing"),
  ];

  return (
    <>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const hasError = i === errorStep;
          const status = hasError
            ? "error"
            : currentStep < i
            ? "inactive"
            : currentStep === i
            ? "current"
            : "active";

          return (
            <div key={i} className="flex items-center space-x-2">
              {status === "error" && (
                <>
                  <XCircleIcon className="h-6 w-6 text-danger-300" />
                  <div className="text-lg font-medium text-white">{step}</div>
                </>
              )}
              {status === "active" && (
                <>
                  <CheckCircleIcon className="h-6 w-6 text-brand-300" />
                  <div className="text-lg font-medium text-white">{step}</div>
                </>
              )}
              {status === "inactive" && (
                <>
                  <div className="ml-[2.5px] h-5 w-5 rounded-full border-2 border-gray-400" />
                  <div className="text-lg font-medium text-gray-400">
                    {step}
                  </div>
                </>
              )}
              {status === "current" && (
                <>
                  <div className="ml-[2.5px] h-5 w-5 animate-pulse rounded-full border-2 border-gray-400" />
                  <div className="animate-pulse text-lg font-medium text-gray-400">
                    {step}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <Retry show={errorStep !== null} url="/onboarding/access/link/" />
    </>
  );
}
