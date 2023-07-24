"use client";

import type { SafeAreaInsets } from "capacitor-plugin-safe-area";
import { purchasesSingleton } from "./purchases";
import { isCapacitorSupported } from "./utils";
import { OS } from "~/constants";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

export const purchases = purchasesSingleton;

async function handleSafeArea() {
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

  if (OS === "android") {
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
      handleInsets(insets),
    );
  } else if (OS === "ios") {
    let styleContent = "";
    for (const key of ["top", "right", "bottom", "left"]) {
      styleContent += `--safe-area-${key}: env(safe-area-inset-${key});`;
    }
    setStyle(styleContent);
  }
}

export async function initCapacitor({ router }: { router: AppRouterInstance }) {
  const supported = isCapacitorSupported();
  if (!supported) return;

  await handleSafeArea();

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
  if (OS === "android") {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await NavigationBar.setTransparency({ isTransparent: true });
  }
  await StatusBar.setStyle({ style: Style.Dark });

  App.addListener("appUrlOpen", ({ url: _url }) => {
    const url = new URL(_url);
    const pathname = url.href.replace(url.origin, "");
    if (pathname !== "/") {
      router.replace(pathname);
    }
  });

  await purchases.init();

  return () => {
    App.removeAllListeners();
  };
}
