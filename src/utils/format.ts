"use client";
import i18next from "i18next";

const { language: locale } = i18next;

export function formatNumber(n: number) {
  return Intl.NumberFormat(locale, {
    notation: "compact",
  }).format(n);
}

export function formatMoney(n: number) {
  return Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    // Don't show fraction digits if integer
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatHour(hour: number) {
  const date = new Date();
  date.setHours(hour);

  return new Intl.DateTimeFormat(i18next.language, {
    hour: "numeric",
  }).format(date);
}
