"use client";

import { App } from "@capacitor/app";
import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

export default function useInternetConnection() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const removeFunctions: (() => void)[] = [];

    (async () => {
      const networkListener = await Network.addListener(
        "networkStatusChange",
        ({ connected }) => {
          setConnected(connected);
        },
      );
      removeFunctions.push(networkListener.remove);
      const appListener = await App.addListener("appStateChange", async () => {
        setConnected((await Network.getStatus()).connected);
      });
      removeFunctions.push(appListener.remove);
    })();

    return () => {
      for (const remove of removeFunctions) {
        remove();
      }
    };
  }, []);

  return connected;
}
