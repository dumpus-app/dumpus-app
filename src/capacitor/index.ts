"use client";

import type { SafeAreaInsets } from "capacitor-plugin-safe-area";
import { purchasesSingleton } from "./purchases";
import { isCapacitorSupported } from "./utils";
import { Capacitor } from "@capacitor/core";

export const purchases = purchasesSingleton;

async function handleSafeArea(isAndroid: boolean, isiOS: boolean) {
  function setStyle(content: string) {
    const id = "capacitor-styles";

    if (document.getElementById(id)) {
      document.getElementById(id)!.textContent = `:root { ${content} }`;
    } else {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `:root { ${content} }`;
      document.head.appendChild(style);
    }
  }

  if (isAndroid) {
    const { SafeArea } = await import("capacitor-plugin-safe-area");

    function handleInsets(insets: SafeAreaInsets["insets"]) {
      let styleContent = "";
      for (const [key, value] of Object.entries(insets)) {
        styleContent += `--safe-area-${key}: ${value}px;`;
      }
      setStyle(styleContent);
    }

    handleInsets((await SafeArea.getSafeAreaInsets()).insets);
    await SafeArea.addListener("safeAreaChanged", ({ insets }) =>
      handleInsets(insets)
    );
  } else if (isiOS) {
    let styleContent = "";
    for (const key of ["top", "right", "bottom", "left"]) {
      styleContent += `--safe-area-${key}: env(safe-area-inset-${key});`;
    }
    setStyle(styleContent);
  }
}

export async function initCapacitor() {
  const supported = isCapacitorSupported();
  if (!supported) return;

  const isAndroid = Capacitor.getPlatform() === "android";
  const isiOS = Capacitor.getPlatform() === "ios";

  await handleSafeArea(isAndroid, isiOS);

  const { App } = await import("@capacitor/app");
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { NavigationBar } = await import(
    "@hugotomazi/capacitor-navigation-bar"
  );

  // TODO: fix in #50
  // App.addListener("backButton", ({ canGoBack }) => {
  //   if (canGoBack) {
  //     window.history.back();
  //   } else {
  //     App.exitApp();
  //   }
  // });
  if (isAndroid) {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await NavigationBar.setTransparency({ isTransparent: true });
  }
  await StatusBar.setStyle({ style: Style.Dark });

  App.addListener("appUrlOpen", ({ url: _url }) => {
    const url = new URL(_url);
    const pathname = url.href.replace(url.origin, "");
    if (pathname !== "/") {
      window.location.href = pathname;
    }
  });

  await purchases.init();

  return () => {
    App.removeAllListeners();
  };
}
