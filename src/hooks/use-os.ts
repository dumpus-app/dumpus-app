"use client";

import { useEffect, useState } from "react";

export type OS = "android" | "ios" | "desktop";

function getOS(): OS {
  const userAgent = window.navigator.userAgent;

  if (new RegExp(/android/, "i").test(userAgent)) {
    return "android";
  }
  if (new RegExp(/(iphone|ipad|ipod)/, "i").test(userAgent)) {
    return "ios";
  }
  return "desktop";
}

export default function useOS() {
  const [os, setOS] = useState<null | OS>(null);

  useEffect(() => {
    setOS(getOS());
  }, []);

  return os;
}
