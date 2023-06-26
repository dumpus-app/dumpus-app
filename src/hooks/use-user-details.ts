"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { selectedPackageAtom } from "~/stores";
import usePackageAPI from "./use-package-api";

export default function useUserDetails({ userID }: { userID: string }) {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const api = usePackageAPI({ baseURL: selectedPackage.backendURL });

  const { data } = useQuery({
    queryKey: ["user", userID],
    queryFn: () =>
      api.user({
        packageID: selectedPackage.package_id,
        UPNKey: selectedPackage.UPNKey,
        userID,
      }),
    staleTime: Infinity,
  });

  return data;
}
