"use client";

export async function initCapacitor() {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV !== "mobile") return;
  if (typeof document === "undefined") return;

  const { App } = await import("@capacitor/app");

  App.addListener("backButton", ({ canGoBack }) => {
    console.log({ canGoBack });
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}

initCapacitor();
