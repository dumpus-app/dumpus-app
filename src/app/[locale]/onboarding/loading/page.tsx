"use client";

import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

// export default async function Page({ params: { locale } }: PageProps) {
//   const { t } = await useTranslation(locale);

//   return <div>Onboarding loading</div>;
// }

const TIMEOUT = 2000;

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.push(`/${i18next.language}/overview`);
    }, 2000);
    return () => {
      clearTimeout(timeoutId);
    };
  });

  return <div>Onboarding loading. Redirection in {TIMEOUT / 1000} seconds</div>;
}
