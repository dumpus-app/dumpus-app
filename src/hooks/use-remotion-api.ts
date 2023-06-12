"use client";

import { useState } from "react";
import type {
  RemotionAPICreateResponse,
  RemotionAPIStatus,
} from "~/types/remotion-api";

export default function useRemotionAPI({
  baseURL = "https://remotion-api.sys.dumpus.app",
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

  async function create(props: { title: string; subtitle: string }) {
    const data = (await api({
      path: "/videos",
      method: "POST",
      headers: { Accept: "application/json" },
      body: props,
    }).then((res) => res.json())) as RemotionAPICreateResponse;
    return data;
  }

  // TODO: what to return?
  function getLink({ id }: { id: string }) {
    return `${baseURL}/videos/${id}`;
    // const response = await api({
    //   path: `/videos/${id}`,
    //   method: "GET",
    //   headers: { Accept: "video/mp4" },
    // });
  }

  const [status, setStatus] = useState<null | RemotionAPIStatus>(null);
  function _status({ id }: { id: string }) {
    const sse = new EventSource(`${baseURL}/videos/sse/${id}`);
    sse.addEventListener(
      "message",
      (e: MessageEvent<{ status: RemotionAPIStatus }>) => {
        setStatus(e.data.status);
      }
    );

    return status;
  }

  return { create, get: getLink, status: _status };
}
