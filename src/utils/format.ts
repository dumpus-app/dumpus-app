"use client";
import i18next from "i18next";

const { language: locale } = i18next;

// TODO: load from i18n. Some locales may have
// different texts for fallbacks
const fallback = "N/A";

export function formatNumber(
  n?: number | null,
  { notation = "compact" }: { notation?: "standard" | "compact" } = {}
) {
  if (n === undefined || n === null) return fallback;

  return Intl.NumberFormat(locale, {
    notation,
  }).format(n);
}

export function formatMoney(
  n?: number | null,
  { currency = "USD" }: { currency?: string } = {}
) {
  if (n === undefined || n === null) return fallback;

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // Don't show fraction digits if integer
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatHour(hour?: number | null) {
  if (hour === undefined || hour === null) return fallback;

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

export function formatDuration(n?: number | undefined, short?: boolean) {
  if (!n) return fallback;

  if (n < 1000) {
    return `${n}ms`;
  }

  if (n < 60000) {
    const seconds = Math.floor(n / 1000);
    return `${seconds}s`;
  }

  if (n < 3600000) {
    const minutes = Math.floor(n / 60000);
    const seconds = Math.floor((n % 60000) / 1000);
    return short ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(n / 3600000);
  const minutes = Math.floor((n % 3600000) / 60000);
  return short ? `${hours}h` : `${hours}h ${minutes}m`;
}
