"use client";

import { purchasesSingleton } from "./purchases";
import { isCapacitorSupported } from "./utils";

export const purchases = purchasesSingleton;

export async function initCapacitor() {
  const supported = isCapacitorSupported();
  if (!supported) return;

  const { App } = await import("@capacitor/app");

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  await purchases.init();

  return () => {
    App.removeAllListeners();
  };
}

initCapacitor();
