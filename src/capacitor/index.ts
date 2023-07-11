"use client";

import type { SafeAreaInsets } from "capacitor-plugin-safe-area";
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

  const { Capacitor } = await import("@capacitor/core");
  const { App } = await import("@capacitor/app");
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { NavigationBar } = await import(
    "@hugotomazi/capacitor-navigation-bar"
  );
  const { SafeArea } = await import("capacitor-plugin-safe-area");

  const isAndroid = Capacitor.getPlatform() === "android";
  const isiOS = Capacitor.getPlatform() === "ios";

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  await StatusBar.setOverlaysWebView({ overlay: true });
  await StatusBar.setStyle({ style: Style.Dark });
  await NavigationBar.setTransparency({ isTransparent: true });

  const root = document.documentElement;

  function handleInsets(insets: SafeAreaInsets["insets"]) {
    for (const [key, value] of Object.entries(insets)) {
      // TODO: find where the bug is
      // On IOS, envValue should not be empty.
      // Maybe add a timeout?
      const envValue = getComputedStyle(root).getPropertyValue(
        `--env-safe-area-${key}-inset`
      );
      root.style.setProperty(
        `--safe-area-${key}`,
        isAndroid ? `${value}px` : envValue
      );
    }
  }

  handleInsets((await SafeArea.getSafeAreaInsets()).insets);
  await SafeArea.addListener("safeAreaChanged", ({ insets }) =>
    handleInsets(insets)
  );

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
