"use client";

import type { PageProps, Rename } from "~/types";
import Header, { type Props as HeaderProps } from "./_components/Header";
import Footer, { type Props as FooterProps } from "./_components/Footer";
import { useI18nPathname } from "~/hooks/use-i18n";

type RouteData = Rename<HeaderProps, "href", "previous"> &
  Rename<FooterProps, "href", "next">;

const ROUTES_DATA: Record<string, RouteData> = {
  "/": { next: "/intro/1", label: "Let's go", progress: null, previous: null },
  "/intro/1": {
    next: "/intro/2",
    label: "Awesome!",
    progress: 0,
    previous: "/",
  },
  "/intro/2": {
    next: "/intro/3",
    label: "I feel better now!",
    progress: 0.33,
    previous: "/intro/1",
  },
  "/intro/3": {
    next: "/setup",
    label: "Can't wait!",
    progress: 0.66,
    previous: "/intro/2",
  },
  "/setup": {
    next: "/access",
    label: "Done!",
    progress: 1,
    previous: "/intro/3",
  },
  "/access": {
    next: null,
    label: null,
    progress: 2,
    previous: "/setup",
  },
  "/access/link": {
    next: null,
    label: null,
    progress: 2.5,
    previous: "/access",
  },
  "/access/email": {
    next: null,
    label: null,
    progress: 2.5,
    previous: "/access",
  },
  "/loading": {
    next: null,
    label: null,
    progress: 3,
    previous: null,
  },
};

const ROUTE_PREFIX = "/onboarding";
const COMPLETE_ROUTE_DATA = Object.fromEntries(
  Object.entries(ROUTES_DATA).map(([k, v]) => {
    k = ROUTE_PREFIX + k;
    if (!k.endsWith("/")) k += "/";
    v.next = v.next ? ROUTE_PREFIX + v.next : v.next;
    v.previous = v.previous ? ROUTE_PREFIX + v.previous : v.previous;
    return [k, v];
  })
);

function getRouteData(pathname: string) {
  return COMPLETE_ROUTE_DATA[
    pathname.endsWith("/") ? pathname : pathname + "/"
  ];
}

export default function Layout({
  children,
}: PageProps<{}, { children: React.ReactNode }>) {
  const pathname = useI18nPathname();
  const { next, label, progress, previous } = getRouteData(pathname);

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
