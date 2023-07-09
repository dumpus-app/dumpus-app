"use client";

import { purchasesSingleton } from "./purchases";
import { isCapacitorSupported } from "./utils";

export const purchases = purchasesSingleton;

export async function initCapacitor({
  navigate,
}: {
  navigate: (url: string) => void;
}) {
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

  App.addListener("appUrlOpen", ({ url: _url }) => {
    const url = new URL(_url);
    const pathname = url.href.replace(url.origin, "");
    if (pathname !== "/") {
      navigate(pathname);
    }
  });

  await purchases.init();

  return () => {
    App.removeAllListeners();
  };
}
