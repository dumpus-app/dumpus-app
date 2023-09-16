"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { shallow } from "zustand/shallow";
import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import usePackageAPI from "~/hooks/use-package-api";
import useSQLInit from "~/hooks/use-sql-init";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";
import Error from "../../loading/_components/Error";

const packageID = "demo";
const UPNKey = packageID;
const packageLink = packageID;

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();

  const [selectedID, getNextID] = useAppStore(
    ({ config, database }) => [config.selectedID, database.getNextID],
    shallow,
  );
  const nextID = getNextID(selectedID);
  const { init } = useSQLInit();
  const api = usePackageAPI({});

  const { data } = useQuery({
    queryKey: ["demo", "data"],
    queryFn: () => api.data({ packageID, UPNKey }),
    staleTime: Infinity,
  });

  useQuery({
    queryKey: ["demo", "redirect"],
    queryFn: () => {
      init({
        id: nextID,
        initData: {
          initialData: data!.data!,
          packageLink,
          UPNKey,
          backendURL: DEFAULT_PACKAGE_API_URL,
        },
      }).then(() => {
        router.replace("/overview/");
      });
      return null;
    },
    staleTime: Infinity,
    enabled: !!data?.data,
  });

  const error = data?.errorMessageCode || undefined;

  if (error) {
    return (
      <Error
        error={
          {
            UNKNOWN_PACKAGE_ID: t("onboarding.loading.unknownPackageId"),
            UNAUTHORIZED: t("onboarding.loading.unauthorized"),
          }[error]
        }
        url="/onboarding/access/"
      />
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.loading.progress.loadingDemo.title")}
        </h1>
        <p className="mt-2 text-gray-400">
          {t("onboarding.loading.progress.loadingDemo.description")}
        </p>
      </div>
    </div>
  );
}
