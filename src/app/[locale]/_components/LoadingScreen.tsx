"use client";

import i18next from "i18next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VERSION } from "~/constants";
import useSQLInit from "~/hooks/use-sql-init";
import { useAppStore } from "~/stores";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "loading screen" });

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

  const [selectedID, goToOnboardingAccess, db] = useAppStore(
    ({ config, database }) => [
      config.selectedID,
      config.goToOnboardingAccess,
      database.db,
    ]
  );
  const { init } = useSQLInit();

  const redirectPath = `/${i18next.language}/onboarding`;

  useEffect(() => {
    if (!loading) return;

    const hasSelectedPackage = !!selectedID;

    if (["/", `/${i18next.language}/`].includes(pathname)) {
      logger.info("/ or /:locale");
      router.replace(`/${i18next.language}/overview`);
      return;
    }

    if (pathname.startsWith(`/${i18next.language}/onboarding/`)) {
      logger.info("onboarding");
      if (!hasSelectedPackage && goToOnboardingAccess) {
        logger.info("go to access");
        router.replace(redirectPath + "/access");
      }
      logger.info("continue");
      setLoading(false);
      return;
    }

    logger.info("no onboarding");
    if (!hasSelectedPackage) {
      logger.info("no package");
      router.replace(`/${i18next.language}/onboarding/`);
      return;
    }

    if (db) {
      logger.info("has db");
      logger.info("continue");
      setLoading(false);
      return;
    }

    logger.info("init db");
    init({ id: selectedID! });
  }, [
    db,
    goToOnboardingAccess,
    init,
    loading,
    pathname,
    redirectPath,
    router,
    selectedID,
  ]);

  if (loading)
    return (
      <>
        <div className="my-auto flex flex-col items-center space-y-4">
          <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
          <div className="max-w-xs text-center">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-gray-400">{description}</p>
          </div>
        </div>
        <div className="mb-2 text-center text-gray-400">{VERSION}</div>
      </>
    );

  return <>{children}</>;
}
