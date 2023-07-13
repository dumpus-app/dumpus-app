"use client";

import { useQuery } from "@tanstack/react-query";
import defu from "defu";
import { useEffect, useRef } from "react";
import { PackageAPIUserResponse } from "~/types/package-api";
import usePackageAPI from "./use-package-api";
import { useAppStore, useSelectedPackage } from "~/stores";

export default function useUserDetails({ userID }: { userID: string }) {
  const [usersCache, setUsersCache] = useAppStore(
    ({ usersCache, setUsersCache }) => [usersCache, setUsersCache]
  );
  const selectedPackage = useSelectedPackage();
  const api = usePackageAPI({ baseURL: selectedPackage.backendURL });
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
