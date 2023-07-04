"use client";

import { WifiIcon } from "@heroicons/react/24/solid";
import useInternetConnection from "~/hooks/use-internet-connection";

export default function ConnectivityHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const connected = useInternetConnection();

  if (!connected) {
    return (
      <div className="my-auto flex flex-col items-center space-y-4">
        <WifiIcon className="mx-auto h-16 w-16 text-gray-400" />
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">
            No Internet Connection
          </h1>
          <p className="mt-2 text-gray-400">
            Internet access is necessary to use the Dumpus app. Please reconnect
            to the Internet to continue.
          </p>
        </div>
      </div>
    );
  }

  return <div className="contents">{children}</div>;
}
