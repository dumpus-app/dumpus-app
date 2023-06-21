"use client";

import { useEffect } from "react";
import { initCapacitor } from "~/capacitor";

export default function useCapacitor() {
  useEffect(() => {
    initCapacitor();
  }, []);
}
