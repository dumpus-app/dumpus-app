"use client";

import Link from "~/components/Link";
import * as ScrollArea from "@radix-ui/react-scroll-area";

export default function UsageStats() {
  return (
    <section className="py-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-lg font-bold text-white">Usage stats</div>
        <Link href="/stats" className="text-brand-300 hover:underline">
          More
        </Link>
      </div>
      <ScrollArea.Root className="relative overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full rounded-[inherit]">
          <div className="flex">
            {[
              { value: "75", label: "server joined" },
              { value: "369", label: "received calls" },
              { value: "845", label: "opened notifs." },
              { value: "2 AM", label: "top hour" },
              { value: "48", label: "network size" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="ml-2 shrink-0 rounded-lg bg-gray-900 p-2"
              >
                <div className="font-semibold text-brand-300">{stat.value}</div>
                <div className="text-sm text-gray-50">{stat.label}</div>
              </div>
            ))}
            <div className="w-2 shrink-0"></div>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="horizontal"
          className="flex touch-none select-none p-0.5 transition-colors duration-[160ms] ease-out data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-gray-600 transition-colors before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] hover:cursor-pointer hover:bg-gray-500" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </section>
  );
}
