"use client";

import { useMemo } from "react";
import { useTranslation } from "~/i18n/client";

/** `YYYY-MM-DD` as local midnight, so formatting gives back the same day. */
function localDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

export function useShareFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "en";

  return useMemo(() => {
    const numberFormat = new Intl.NumberFormat(locale);
    const hourFormat = new Intl.DateTimeFormat(locale, { hour: "numeric" });

    return {
      t,
      number: (n: number) => numberFormat.format(Math.round(n)),
      percent: (share: number) =>
        new Intl.NumberFormat(locale, { style: "percent" }).format(share),
      hour: (hour: number) => hourFormat.format(new Date(2020, 0, 1, hour)),
      day: (day: string, options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, options).format(localDay(day)),
      /** `90` as "1 h 30 min", `45` as "45 min". */
      duration: (minutes: number) => {
        const rounded = Math.round(minutes);
        if (rounded < 60) {
          return t("share.units.minutes", {
            value: numberFormat.format(rounded),
          });
        }
        const hours = Math.floor(rounded / 60);
        const rest = rounded % 60;
        return rest === 0 || hours >= 10
          ? t("share.units.hours", { value: numberFormat.format(hours) })
          : t("share.units.hoursMinutes", {
              hours: numberFormat.format(hours),
              minutes: numberFormat.format(rest),
            });
      },
    };
  }, [locale, t]);
}

export type ShareFormat = ReturnType<typeof useShareFormat>;
