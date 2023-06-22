"use client";

import i18next from "i18next";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useEffectOnce } from "react-use";
import useSQL from "~/hooks/use-sql";
import { configAtom } from "~/stores";

export default function LoadingScreen({
  children,
  data: { title, description },
}: {
  children: React.ReactNode;
  data: { title: string; description: string };
}) {
  const [loading, setLoading] = useState(true);

  const pathname = usePathname() || "/";
  const router = useRouter();

  const [config, setConfig] = useAtom(configAtom);
  const { init } = useSQL();
  const isInitializedRef = useRef(false);

  const redirectPath = `/${i18next.language}/onboarding`;

  useEffectOnce(() => {
    // TODO: check if required. Was probably a bug
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setConfig(config);

    const hasSelectedPackage = !!config.db.selectedId;

    if (pathname.startsWith(redirectPath)) {
      if (!hasSelectedPackage && config.goToOnboardingAccess) {
        router.replace(redirectPath + "/access");
      }

      return;
    }

    if (hasSelectedPackage) {
      init({ id: config.db.selectedId! }).then(() => {
        router.push(`/${i18next.language}/overview`);
        return;
      });
    }

    router.replace(redirectPath);
  });

  useEffect(() => {
    if (!loading) return;

    const prefix = `/${i18next.language}/`;
    if (pathname.startsWith(prefix) && pathname !== prefix) {
      setLoading(false);
    }
  }, [loading, pathname]);

  if (loading)
    return (
      <div className="my-auto flex flex-col items-center space-y-4">
        <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-gray-400">{description}</p>
        </div>
      </div>
    );

  return <>{children}</>;
}
