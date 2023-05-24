"use client";

import { useEffect, useState } from "react";

export type OS = "android" | "ios" | "desktop";

function getOS(): OS {
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    return "android";
  } else if (/(iphone|ipad|ipod)/.test(userAgent)) {
    return "ios";
  } else {
    return "desktop";
  }
}

export default function useOS() {
  const [os, setOS] = useState<null | OS>(null);

  useEffect(() => {
    setOS(getOS());
  }, []);

  return os;
}
