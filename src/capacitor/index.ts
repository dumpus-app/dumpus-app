"use client";

import type { SafeAreaInsets } from "capacitor-plugin-safe-area";

export async function initCapacitor() {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV !== "mobile") return;
  if (typeof document === "undefined") return;

  const { App } = await import("@capacitor/app");
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { NavigationBar } = await import(
    "@hugotomazi/capacitor-navigation-bar"
  );
  const { SafeArea } = await import("capacitor-plugin-safe-area");

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
      const envValue = getComputedStyle(root).getPropertyValue(
        `--env-safe-area-${key}-inset`
      );
      root.style.setProperty(
        `--safe-area-${key}`,
        envValue === "" ? `${value}px` : envValue
      );
    }
  }

  handleInsets((await SafeArea.getSafeAreaInsets()).insets);
  await SafeArea.addListener("safeAreaChanged", ({ insets }) =>
    handleInsets(insets)
  );
}

initCapacitor();
