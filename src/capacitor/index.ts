"use client";

import { colors } from "../../tailwind.config";

export async function initCapacitor() {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV !== "mobile") return;
  if (typeof document === "undefined") return;

  const { App } = await import("@capacitor/app");
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { NavigationBar } = await import(
    "@hugotomazi/capacitor-navigation-bar"
  );

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  const color = colors.gray[950];

  await StatusBar.setOverlaysWebView({ overlay: false });
  await StatusBar.setBackgroundColor({ color });
  await StatusBar.setStyle({ style: Style.Dark });

  await NavigationBar.setColor({ color });
}

initCapacitor();
