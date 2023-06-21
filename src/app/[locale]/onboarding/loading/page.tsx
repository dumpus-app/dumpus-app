"use client";

import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import usePackageAPI from "~/hooks/use-package-api";
import useSQL from "~/hooks/use-sql";
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

  const { init } = useSQL();
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
          {statusQuery.data.processingStep === "LOCKED"
            ? (function () {
                const queueData = statusQuery.data.processingQueuePosition;

                const queuePosition = queueData.user;
                const queueTotal = queueData.totalWhenStarted;

                // user - (totalWhenStarted - total)
                // const queuePosition = 100 - Math.abs(100 - 100);
                // const queuePosition = 95 - Math.abs(100 - 95);
                // const queuePosition = 95 - Math.abs(100 - 105);
                // const queuePosition = 91 - Math.abs(100 - 104);
                // totalWhenStarted
                // const queueTotal = 100;

                // const usersJoinedAfter =
                //   queueData.user - queueData.userWhenStarted;
                // const queuePosition = usersJoinedAfter + 1;
                // const queueTotal =
                //   queueData.total -
                //   queueData.totalWhenStarted +
                //   queueData.userWhenStarted;

                return (
                  <div>
                    <div>
                      <div className="mb-2">
                        Position in queue: {queuePosition}/{queueTotal}
                      </div>
                      <div className="relative h-3 overflow-hidden rounded-full bg-brand-950 duration-700">
                        <div
                          className="absolute inset-0 origin-[0%] bg-brand-300 transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `scaleX(clamp(0, ${
                              1 - queuePosition / queueTotal
                            }, 1))`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()
            : (function () {
                /**
                 * 0 Downloading
                 * 1 Analyzing
                 * 2 Setup DB
                 */
                const step = (() => {
                  switch (statusQuery.data.processingStep) {
                    case "DOWNLOADING":
                      return 0;
                    case "ANALYZING":
                      return 1;
                    case "PROCESSED":
                      return 2;
                  }
                })();
                // TODO: create checklist
                return (
                  <div>
                    <div>Downloading: {JSON.stringify(step >= 0)}</div>
                    <div>Analyzing: {JSON.stringify(step >= 1)}</div>
                    <div>Processed: {JSON.stringify(step >= 2)}</div>
                  </div>
                );
              })()}
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
