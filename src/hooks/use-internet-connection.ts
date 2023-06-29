"use client";

import { useEffect, useState } from "react";
import { useNetworkState } from "react-use";
import { Network } from "@capacitor/network";

const isMobile = process.env.NEXT_PUBLIC_DEPLOY_ENV === "mobile";

export default function useInternetConnection() {
  const [connected, setConnected] = useState(true);
  const state = useNetworkState();

  useEffect(() => {
    if (!isMobile) return;

    Network.addListener("networkStatusChange", ({ connected }) => {
      setConnected(connected);
    });

    return () => {
      Network.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    setConnected(state.online || false);
  }, [state]);

  return connected;
}
