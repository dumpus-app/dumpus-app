"use client";

import { useQuery } from "@tanstack/react-query";
import defu from "defu";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { usersCacheAtom } from "~/stores";
import { PackageAPIUserResponse } from "~/types/package-api";
import usePackageAPI from "./use-package-api";
import { useConfigStore } from "~/stores/config";

export default function useUserDetails({ userID }: { userID: string }) {
  const selectedPackage = useConfigStore(
    (state) => state.computed.selectedPackage
  );
  const api = usePackageAPI({ baseURL: selectedPackage.backendURL });
  const [usersCache, setUsersCache] = useAtom(usersCacheAtom);
  const doneRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["user", userID],
    queryFn: () =>
      api.user({
        packageID: selectedPackage.package_id,
        UPNKey: selectedPackage.UPNKey,
        userID,
      }),
    staleTime: Infinity,
    refetchInterval: (data) => {
      if (data?.errorMessageCode === "RATE_LIMITED") {
        return 500;
      }

      return false;
    },
  });

  const userCache = usersCache.find((user) => user.user_id === userID);

  useEffect(() => {
    if (doneRef.current || !data || data.errorMessageCode) return;
    doneRef.current = true;

    const newCache = usersCache.slice();
    if (userCache) {
      const index = newCache.findIndex((user) => user.user_id === userID);
      newCache[index] = data;
    } else {
      newCache.push(data);
    }

    setUsersCache(newCache);
  }, [data, setUsersCache, userCache, userID, usersCache]);

  return defu(userCache, data) as PackageAPIUserResponse | undefined;
}
