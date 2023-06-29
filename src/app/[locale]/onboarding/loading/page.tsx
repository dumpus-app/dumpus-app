"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import usePackageAPI from "~/hooks/use-package-api";
import useSQLInit from "~/hooks/use-sql-init";
import { useTranslation } from "~/i18n/client";
import { nextDbIdAtom } from "~/stores/db";
import { PackageAPIProcessResponse } from "~/types/package-api";

export default function Page() {
  const { t } = useTranslation();

  const router = useRouter();
  const searchParams = useSearchParams();

  const packageLink = searchParams?.get("packageLink") || undefined;
  const backendURL = searchParams?.get("backendURL") || undefined;
  const UPNKey = packageLink
    ? new URL(packageLink).searchParams.get("upn") || undefined
    : undefined;

  const { init } = useSQLInit();
  const api = usePackageAPI({ baseURL: backendURL });

  const isInitializedRef = useRef(false);
  const isStatusQueryEnabled = useRef(false);
  const [processData, setProcessData] =
    useState<null | PackageAPIProcessResponse>(null);

  // Initial mutation
  useEffect(() => {
    if (!packageLink || isInitializedRef.current) return;
    isInitializedRef.current = true;

    api.process({ packageLink }).then((data) => {
      setProcessData(data);
      isStatusQueryEnabled.current = data?.isAccepted || false;
    });
  }, [api, packageLink]);

  const statusQuery = useQuery({
    queryKey: ["package-api", "status", processData?.packageId],
    queryFn: () =>
      api.status({
        packageID: processData!.packageId,
        UPNKey: UPNKey!,
      }),
    enabled: isStatusQueryEnabled.current,
    refetchInterval: 1000, // 1s
  });

  const nextDbId = useAtomValue(nextDbIdAtom);

  useEffect(() => {
    if (
      statusQuery.data?.processingStep !== "PROCESSED" ||
      !packageLink ||
      !UPNKey ||
      !processData
    ) {
      return;
    }
    isStatusQueryEnabled.current = false;

    api
      .data({ packageID: processData!.packageId, UPNKey: UPNKey! })
      .then(({ data, errorMessageCode }) => {
        if (errorMessageCode) {
          // TODO: handle Error
          return;
        }
        init({
          id: nextDbId,
          initData: {
            initialData: data,
            packageLink,
            UPNKey,
            backendURL: backendURL || DEFAULT_PACKAGE_API_URL,
          },
        }).then(() => {
          router.replace(`/${i18next.language}/overview`);
        });
      });
  }, [
    UPNKey,
    api,
    backendURL,
    init,
    nextDbId,
    packageLink,
    processData,
    router,
    statusQuery,
  ]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      {processData && statusQuery.isSuccess && statusQuery.data ? (
        <>
          {statusQuery.data.processingStep === "LOCKED" ? (
            <div className="max-w-xs text-center">
              <h1 className="text-xl font-bold text-white">Almost there!</h1>
              <h2 className="mt-4 text-7xl font-bold text-brand-300">
                {statusQuery.data.processingQueuePosition.user}
              </h2>
              <p className="text-gray-400">people before you</p>
            </div>
          ) : (
            (function () {
              /**
               * 0 Downloading
               * 1 Analyzing
               * 2 Setup DB
               */
              const currentStep = (() => {
                switch (statusQuery.data.processingStep) {
                  case "DOWNLOADING":
                    return 0;
                  case "ANALYZING":
                    return 1;
                  case "PROCESSED":
                    return 2;
                }
              })();

              const errorStep = statusQuery.data.isErrored ? currentStep : null;

              const steps = ["Downloading", "Analyzing", "Processed"];

              return (
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
              );
            })()
          )}
        </>
      ) : (
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">
            We’re loading your data
          </h1>
          <p className="mt-2 text-gray-400">Please wait...</p>
        </div>
      )}
    </div>
  );
}
