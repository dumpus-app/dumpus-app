"use client";

import type { PageProps, Rename } from "~/types";
import Header, { type Props as HeaderProps } from "./_components/Header";
import Footer, { type Props as FooterProps } from "./_components/Footer";
import { useI18nPathname } from "~/hooks/use-i18n";
import { useTranslation } from "~/i18n/client";

type RouteData = Rename<HeaderProps, "href", "previous"> &
  Rename<FooterProps, "href", "next">;

const ROUTE_PREFIX = "/onboarding";

function getRouteData(
  pathname: string,
  t: ReturnType<typeof useTranslation>["t"]
) {
  pathname = pathname.replace(ROUTE_PREFIX, "");
  if (pathname !== "/") {
    pathname = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  }

  const next = t(`onboarding.routes.${pathname}.next`, {
    defaultValue: "",
  }) as unknown as RouteData["next"];
  const label = t(`onboarding.routes.${pathname}.label`, {
    defaultValue: "",
  }) as unknown as RouteData["label"];
  const progress = t(`onboarding.routes.${pathname}.progress`, {
    defaultValue: "",
  }) as unknown as RouteData["progress"];
  const previous = t(`onboarding.routes.${pathname}.previous`, {
    defaultValue: "",
  }) as unknown as RouteData["previous"];

  return {
    next: next ? ROUTE_PREFIX + next : next,
    label,
    progress,
    previous: previous ? ROUTE_PREFIX + previous : previous,
  };
}

export default function Layout({
  children,
}: PageProps<{}, { children: React.ReactNode }>) {
  const pathname = useI18nPathname();
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
