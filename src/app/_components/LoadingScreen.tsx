"use client";

import { XCircleIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useEffectOnce } from "react-use";
import { useShallow } from "zustand/react/shallow";
import Button from "~/components/Button";
import EmptyState from "~/components/EmptyState";
import { VERSION } from "~/constants";
import useSQLInit, {
  loadErrorCode,
  type PackageLoadErrorCode,
} from "~/hooks/use-sql-init";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";
import { createLogger } from "~/utils/logger";

const logger = createLogger({ tag: "loading screen" });

export default function LoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [shouldHaveDB, setShouldHaveDB] = useState(false);
  const [failure, setFailure] = useState<PackageLoadErrorCode | null>(null);
  const { t } = useTranslation();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [selectedID, goToOnboardingAccess, loadingData, db] = useAppStore(
    useShallow(({ config, database }) => [
      config.selectedID,
      config.goToOnboardingAccess,
      config.loadingData,
      database.db,
    ]),
  );
  const hasSelectedPackage = !!selectedID;

  const { init } = useSQLInit();

  useEffectOnce(() => {
    let mounted = true;

    async function handlePathname(pathname: string, hasDB: boolean) {
      if (pathname === "/") {
        logger.info("/ (root)");
        return handlePathname("/overview", hasDB);
      }

      if (pathname.startsWith("/onboarding/")) {
        logger.info("onboarding");

        if (!!loadingData) {
          logger.info("go to loading");

          const { packageLink, backendURL } = loadingData;
          pathname = `/onboarding/loading/?packageLink=${encodeURIComponent(
            packageLink,
          )}&backendURL=${encodeURIComponent(backendURL || "")}`;
        } else if (goToOnboardingAccess) {
          logger.info("go to access");

          pathname = "/onboarding/access";
        }
        return pathname;
      }

      logger.info("no onboarding");
      if (!hasSelectedPackage) {
        logger.info("no package");
        return handlePathname("/onboarding/", hasDB);
      }

      setShouldHaveDB(true);

      if (hasDB) {
        logger.info("has db");
        return pathname;
      }

      logger.info("init db");
      await init({ id: selectedID! });
      return handlePathname(pathname, true);
    }

    (async () => {
      try {
        const destination = await handlePathname(pathname, !!db);
        logger.info("continue");
        if (mounted) {
          router.replace(destination);
          setLoading(false);
        }
      } catch (err) {
        logger.error("couldn't open the package", err);
        setFailure(loadErrorCode(err));
      }
    })();

    return () => {
      mounted = false;
    };
  });

  if (failure)
    return (
      <div className="my-auto flex flex-col items-center px-2">
        <EmptyState
          icon={XCircleIcon}
          title={t("error.error")}
          description={
            {
              STORAGE_FULL: t("settings.actions.notEnoughStorage.description"),
              UNKNOWN_PACKAGE_ID: t("onboarding.loading.unknownPackageId"),
              UNAUTHORIZED: t("onboarding.loading.unauthorized"),
              UNKNOWN_ERROR: t("onboarding.loading.unknownError"),
            }[failure]
          }
        />
        <div className="flex flex-col space-y-2">
          <Button onClick={() => window.location.reload()}>
            {t("error.retry")}
          </Button>
          <Button
            variant="gray"
            onClick={() => {
              setFailure(null);
              setShouldHaveDB(false);
              setLoading(false);
              router.replace("/onboarding/access/");
            }}
          >
            {t("settings.actions.addPackage")}
          </Button>
        </div>
      </div>
    );

  if (loading || (!db && hasSelectedPackage && shouldHaveDB))
    return (
      <>
        <div className="my-auto flex flex-col items-center space-y-4">
          <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
          <div className="max-w-xs text-center">
            <h1 className="text-xl font-bold text-white">
              {t("global.loading.title")}
            </h1>
            <p className="mt-2 text-gray-400">
              {t("global.loading.description")}
            </p>
          </div>
        </div>
        <div className="mb-2 text-center text-gray-400">{VERSION}</div>
      </>
    );

  return <>{children}</>;
}
