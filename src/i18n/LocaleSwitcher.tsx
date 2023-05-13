"use client";

import Link from "next/link";
import { locales } from "~/i18n/settings";
import { useTranslation } from "~/i18n/client";
import { usePathname } from "next/navigation";
import i18next from "i18next";

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const pathname = usePathname();

  return (
    <div>
      <span>{t("localeSwitcher", { locale })}</span>
      {locales
        .filter((l) => locale !== l)
        .map((l, index) => {
          return (
            <span key={l}>
              {index > 0 && " or "}
              <Link href={(pathname || "/").replace(i18next.language, l)}>
                {l}
              </Link>
            </span>
          );
        })}
    </div>
  );
}
