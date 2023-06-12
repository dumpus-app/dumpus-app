"use client";

import type {
  PackageAPIDataResponse,
  PackageAPIProcessResponse,
  PackageAPIRemoveResponse,
  PackageAPIStatusResponse,
} from "~/types/package-api";

export default function usePackageAPI({
  baseURL = "https://dumpus-api.sys.dumpus.app",
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

  async function process({ packageLink }: { packageLink: string }) {
    const data = (await api({
      path: "/process",
      method: "POST",
      headers: { Accept: "application/json" },
      body: { packageLink },
    }).then((res) => res.json())) as PackageAPIProcessResponse;
    return data;
  }

  async function status({
    packageID,
    UPNKey,
  }: {
    packageID: string;
    UPNKey: string;
  }) {
    const data = (await api({
      path: `/process/${packageID}/status`,
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${UPNKey}`,
      },
    }).then((res) => res.json())) as PackageAPIStatusResponse;
    return data;
  }

  async function data({
    packageID,
    UPNKey,
  }: {
    packageID: string;
    UPNKey: string;
  }) {
    const response = await api({
      path: `/process/${packageID}/data`,
      method: "GET",
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${UPNKey}`,
      },
    });
    let data: PackageAPIDataResponse;
    switch (response.status) {
      case 401:
        data = { data: null, errorMessageCode: "UNAUTHORIZED" };
      case 404:
        data = { data: null, errorMessageCode: "UNKNOWN_PACKAGE_ID" };
      default:
        data = { data: await response.text(), errorMessageCode: null };
    }
    return data;
  }

  async function remove({
    packageID,
    UPNKey,
  }: {
    packageID: string;
    UPNKey: string;
  }) {
    const data = (await api({
      path: `/process/${packageID}`,
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${UPNKey}`,
      },
    }).then((res) => res.json())) as PackageAPIRemoveResponse;
    return data;
  }

  return { process, status, data, remove };
}
