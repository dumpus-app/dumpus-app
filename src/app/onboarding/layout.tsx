"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "~/i18n/client";
import type { PageProps, Rename } from "~/types";
import Footer, { type Props as FooterProps } from "./_components/Footer";
import Header, { type Props as HeaderProps } from "./_components/Header";

type RouteData = Rename<HeaderProps, "href", "previous"> &
  Rename<FooterProps, "href", "next">;

const ROUTES: Record<string, Omit<RouteData, "label">> = {
  "/": {
    next: "/intro/1",
    progress: null,
    previous: null,
  },
  "/intro/1": {
    next: "/intro/2",
    progress: 0,
    previous: "/",
  },
  "/intro/2": {
    next: "/intro/3",
    progress: 0.33,
    previous: "/intro/1",
  },
  "/intro/3": {
    next: "/setup",
    progress: 0.66,
    previous: "/intro/2",
  },
  "/setup": {
    next: "/access",
    progress: 1,
    previous: "/intro/3",
  },
  "/access": {
    next: null,
    progress: 2,
    previous: "/setup",
  },
  "/access/link": {
    next: null,
    progress: 2.5,
    previous: "/access",
  },
  "/access/email": {
    next: null,
    progress: 2.5,
    previous: "/access",
  },
  "/access/demo": {
    next: null,
    progress: 3,
    previous: null,
  },
  "/loading": {
    next: null,
    progress: 3,
    previous: null,
  },
};

const ROUTE_PREFIX = "/onboarding";

function getRouteData(
  pathname: string,
  t: ReturnType<typeof useTranslation>["t"],
): RouteData {
  pathname = pathname.replace(ROUTE_PREFIX, "");
  if (pathname !== "/") {
    pathname = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  }

  const { next, progress, previous } = ROUTES[pathname];

  const label = t(`onboarding.routesLabels.${pathname}`, {
    defaultValue: "",
  }) as string;

  return {
    next: next ? ROUTE_PREFIX + next : next,
    label: label === "" ? null : label,
    progress,
    previous: previous ? ROUTE_PREFIX + previous : previous,
  };
}

export default function Layout({
  children,
}: PageProps<{}, { children: React.ReactNode }>) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const { next, label, progress, previous } = getRouteData(pathname, t);

  return (
    <>
      <Header href={previous} progress={progress} />
      <div className="my-auto w-full px-4 py-16 sm:mx-auto sm:max-w-sm">
        {children}
      </div>
      <Footer href={next} label={label} />
    </>
  );
}
