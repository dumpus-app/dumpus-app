import { useAtom } from "jotai";
import { useEffect } from "react";
import { initAtom } from "~/stores";

export default function useLoading() {
  const [init, setInit] = useAtom(initAtom);
  useEffect(() => {
    if (init) return;

    setTimeout(() => {
      setInit(true);
    }, 1000);
  }, [init, setInit]);

  return !init;
}
