"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import useStoreInit from "~/hooks/use-store-init";
import { queryClient } from "~/utils/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  useStoreInit();
  return (
    <Provider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}
