"use client";

import i18next from "i18next";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import usePackageAPI from "~/hooks/use-package-api";
import useSQL from "~/hooks/use-sql";
import { nextDbIdAtom } from "~/stores/db";

const packageID = "demo";
const UPNKey = packageID;
const packageLink = packageID;

export default function Page() {
  const router = useRouter();

  const nextDbId = useAtomValue(nextDbIdAtom);
  const { init } = useSQL();
  const api = usePackageAPI({});

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    api.data({ packageID, UPNKey }).then(({ data, errorMessageCode }) => {
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
          backendURL: DEFAULT_PACKAGE_API_URL,
        },
      }).then(() => {
        router.push(`/${i18next.language}/overview`);
      });
    });
  }, [api, init, nextDbId, router]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">We’re loading the demo</h1>
        <p className="mt-2 text-gray-400">Please wait...</p>
      </div>
    </div>
  );
}
