"use client";

import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import usePackageAPI from "~/hooks/use-package-api";
import useSQLInit from "~/hooks/use-sql-init";
import { useAppStore } from "~/stores";

type API = ReturnType<typeof usePackageAPI>;

function useURLParams() {
  const searchParams = useSearchParams();

  const packageLink = searchParams?.get("packageLink") || undefined;
  const backendURL = searchParams?.get("backendURL") || undefined;
  const UPNKey = packageLink
    ? new URL(packageLink).searchParams.get("upn") || undefined
    : undefined;

  return { packageLink, backendURL, UPNKey };
}

function useProcess({
  api,
  packageLink,
  enabled,
}: {
  api: API;
  packageLink: string;
  enabled: boolean;
}) {
  const { data, status } = useQuery({
    queryKey: ["package-api", "process", packageLink],
    queryFn: () => api.process({ packageLink }),
    enabled,
    staleTime: Infinity,
  });

  return { data, status };
}

function useStatus({
  api,
  packageID,
  UPNKey,
  enabled,
}: {
  api: API;
  packageID: string;
  UPNKey: string;
  enabled: boolean;
}) {
  const [erroredStatus, setErroredStatus] = useState(false);

  const { data, status } = useQuery({
    queryKey: ["package-api", "status", packageID],
    queryFn: () =>
      api.status({
        packageID,
        UPNKey,
      }),
    enabled: enabled && !erroredStatus,
    refetchInterval: 1000, // 1s
  });

  useEffect(() => {
    setErroredStatus(!!data?.isErrored);
  }, [data]);

  return { data, status };
}

function useData({
  api,
  packageID,
  UPNKey,
  enabled,
}: {
  api: API;
  packageID: string;
  UPNKey: string;
  enabled: boolean;
}) {
  const { data, status } = useQuery({
    queryKey: ["package-api", "data", packageID],
    queryFn: () => api.data({ packageID, UPNKey }),
    enabled,
    staleTime: Infinity,
  });

  return { data, status };
}

function useRedirect({
  packageID,
  initialData,
  packageLink,
  UPNKey,
  backendURL,
  afterInit,
}: {
  packageID: string;
  initialData?: ArrayBuffer;
  packageLink: string;
  UPNKey: string;
  backendURL?: string;
  afterInit: () => void;
}) {
  const router = useRouter();
  const { init } = useSQLInit();
  const [selectedID, getNextID] = useAppStore(
    ({ config, database }) => [config.selectedID, database.getNextID],
    shallow,
  );

  const nextID = getNextID(selectedID);

  useQuery({
    queryKey: ["package-loading", "redirect", packageID],
    queryFn: () => {
      init({
        id: nextID,
        initData: {
          initialData: initialData!,
          packageLink,
          UPNKey,
          backendURL: backendURL || DEFAULT_PACKAGE_API_URL,
        },
      }).then(() => {
        afterInit();
        router.replace(`/${i18next.language}/overview`);
      });
      return null;
    },
    enabled: !!initialData,
    staleTime: Infinity,
  });
}

export default function useLogic() {
  const { packageLink, backendURL, UPNKey } = useURLParams();
  const api = usePackageAPI({ baseURL: backendURL });
  const setLoadingData = useAppStore(({ config }) => config.setLoadingData);

  const process = useProcess({
    api,
    packageLink: packageLink || "",
    enabled: !!packageLink,
  });

  const processValid = !!process.data?.isAccepted;
  const packageID = process.data?.packageId;

  useQuery({
    queryKey: ["package-api", "save-state"],
    queryFn: () => {
      setLoadingData({ packageLink: packageLink!, backendURL });
      return null;
    },
    staleTime: Infinity,
    enabled: processValid,
  });

  const status = useStatus({
    api,
    packageID: packageID || "",
    UPNKey: UPNKey || "",
    enabled: processValid,
  });

  const data = useData({
    api,
    packageID: packageID || "",
    UPNKey: UPNKey || "",
    enabled: status.data?.processingStep === "PROCESSED",
  });

  useRedirect({
    packageID: packageID || "",
    initialData: data.data?.data || undefined,
    packageLink: packageLink || "",
    UPNKey: UPNKey || "",
    backendURL,
    afterInit: () => {
      setLoadingData(undefined);
    },
  });

  const error =
    process.data?.errorMessageCode ||
    status.data?.errorMessageCode ||
    data.data?.errorMessageCode ||
    null;

  return { process, status, data, error };
}
