"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { selectedPackageAtom, usersCacheAtom } from "~/stores";
import usePackageAPI from "./use-package-api";
import { useEffect, useRef } from "react";
import defu from "defu";
import { PackageAPIUserResponse } from "~/types/package-api";

export default function useUserDetails({ userID }: { userID: string }) {
  const selectedPackage = useAtomValue(selectedPackageAtom);
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
