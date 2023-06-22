"use client";

import { DEFAULT_WIDGET_API_URL } from "~/constants";
import { WidgetAPIGuildResponse } from "~/types/widget-api";

export default function useWidgetAPI({
  baseURL = DEFAULT_WIDGET_API_URL,
}: {
  baseURL?: string;
}) {
  function api({
    path,
    method,
    headers,
    body,
  }: {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: HeadersInit;
    body?: any;
  }) {
    return fetch(baseURL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  }

  async function getGuild({ id }: { id: string }) {
    const data = (await api({
      path: `/${id}`,
      method: "GET",
      headers: { Accept: "application/json" },
    }).then((res) => res.json())) as WidgetAPIGuildResponse;

    return data;
  }

  return { getGuild };
}
