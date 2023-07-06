"use client";

import { useRouter } from "next/navigation";
import { useEffectOnce } from "react-use";
import { initCapacitor } from "~/capacitor";

export default function useCapacitor() {
  const router = useRouter();
  useEffectOnce(() => {
    initCapacitor({ navigate: router.replace });
  });
}
