"use client";

import { App } from "@capacitor/app";
import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

export default function useInternetConnection() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const unsub: (() => void)[] = [
      Network.addListener("networkStatusChange", ({ connected }) => {
        setConnected(connected);
      }).remove,
      App.addListener("appStateChange", async () => {
        setConnected((await Network.getStatus()).connected);
      }).remove,
    ];

    return () => {
      for (const fn of unsub) {
        fn();
      }
    };
  }, []);

  return connected;
}
