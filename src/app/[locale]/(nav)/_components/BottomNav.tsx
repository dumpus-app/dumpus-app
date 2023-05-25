"use client";

import { links } from "~/constants";
import Link from "~/components/Link";
import clsx from "clsx";
import { useI18nPathname } from "~/hooks/use-i18n";

export type Props = {
  children?: React.ReactNode;
};

export default function BottomNav({ children }: Props) {
  const pathname = useI18nPathname();

  return (
    <div className="sticky bottom-0 z-20">
      {children}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-1 px-1 py-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex w-full flex-col items-center rounded-lg py-1 transition-colors",
                link.active(pathname)
                  ? "bg-gray-800 text-brand-300"
                  : "text-gray-400 hover:bg-gray-800"
              )}
            >
              <link.icon className="h-6 w-6" />
              <span className="mt-1">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
