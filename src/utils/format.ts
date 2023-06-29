"use client";
import i18next from "i18next";

const { language: locale } = i18next;

// TODO: load from i18n. Some locales may have
// different texts for fallbacks
const fallback = "N/A";

export function formatNumber(n?: number | null) {
  if (!n) return fallback;

  return Intl.NumberFormat(locale, {
    notation: "compact",
  }).format(n);
}

export function formatMoney(n?: number | null) {
  if (!n) return fallback;

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    // Don't show fraction digits if integer
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatHour(hour?: number | null) {
  if (!hour) return fallback;

  const date = new Date();
  date.setHours(hour);

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).format(date);
}

export function formatDate(
  date?: Date | string | null,
  {
    year = "numeric",
    month = true,
    day = true,
    hour = true,
    minute = true,
  }: {
    year?: false | "numeric" | "2-digit";
    month?: boolean;
    day?: boolean;
    hour?: boolean;
    minute?: boolean;
  } = {}
) {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    year: year === false ? undefined : year,
    month: month ? "2-digit" : undefined,
    day: day ? "2-digit" : undefined,
    hour: hour ? "2-digit" : undefined,
    minute: minute ? "2-digit" : undefined,
  }).format(typeof date === "string" ? new Date(date) : date);
}
