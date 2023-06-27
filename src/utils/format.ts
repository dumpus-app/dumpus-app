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

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).format(date);
}

export function formatDate(
  date: Date | string,
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
  return new Intl.DateTimeFormat(locale, {
    year: year === false ? undefined : year,
    month: month ? "2-digit" : undefined,
    day: day ? "2-digit" : undefined,
    hour: hour ? "2-digit" : undefined,
    minute: minute ? "2-digit" : undefined,
  }).format(typeof date === "string" ? new Date(date) : date);
}
