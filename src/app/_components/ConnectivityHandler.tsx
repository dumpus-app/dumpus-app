"use client";

import { WifiIcon } from "@heroicons/react/24/solid";
import useInternetConnection from "~/hooks/use-internet-connection";
import { useTranslation } from "~/i18n/client";

export default function ConnectivityHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const connected = useInternetConnection();

  if (!connected) {
    return (
      <div className="my-auto flex flex-col items-center space-y-4">
        <WifiIcon className="mx-auto h-16 w-16 text-gray-400" />
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">
            {t("error.noInternet")}
          </h1>
          <p className="mt-2 text-gray-400">
            {t("error.noInternetDescription")}
          </p>
        </div>
      </div>
    );
  }

  return <div className="contents">{children}</div>;
}
