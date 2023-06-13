"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import usePackageAPI from "~/hooks/use-package-api";
import useSQL from "~/hooks/use-sql";
import { useTranslation } from "~/i18n/client";

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

  const processMutation = useMutation({
    mutationKey: ["package-api", "process", packageLink],
    mutationFn: api.process,
  });

  // Initial mutation
  useEffect(() => {
    if (!packageLink || isInitializedRef.current) return;
    isInitializedRef.current = true;

    setTimeout(() => {
      processMutation.mutate({ packageLink });
    }, 10);
  }, [packageLink, processMutation]);

  const statusQuery = useQuery({
    queryKey: ["package-api", "status", processMutation.data?.packageId],
    queryFn: () =>
      api.status({
        packageID: processMutation.data!.packageId,
        UPNKey: UPNKey!,
      }),
    enabled: processMutation.data?.isAccepted,
    refetchInterval: 1000, // 1s
  });

  // useEffect(() => {
  // init();
  // router.push(`/${i18next.language}/overview`);
  // }, [init]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      {processMutation.isSuccess || statusQuery.isSuccess ? (
        <div>{JSON.stringify(statusQuery.data, null, 2)}</div>
      ) : (
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">
            We’re loading your data
          </h1>
          <p className="mt-2 text-gray-400">
            Please wait... {processMutation.status}
          </p>
        </div>
      )}
    </div>
  );
}
