"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

export default function useInternetConnection() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    Network.addListener("networkStatusChange", ({ connected }) => {
      setConnected(connected);
    });

    return () => {
      Network.removeAllListeners();
    };
  }, []);

  return connected;
}
