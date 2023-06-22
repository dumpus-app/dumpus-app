"use client";

import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import type {
  PackageAPIDataResponse,
  PackageAPIProcessResponse,
  PackageAPIRemoveResponse,
  PackageAPIStatusResponse,
  PackageAPIUserResponse,
} from "~/types/package-api";

export default function usePackageAPI({
  baseURL = DEFAULT_PACKAGE_API_URL,
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: { package_link: packageLink },
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

    const data: PackageAPIDataResponse =
      response.status === 401
        ? { data: null, errorMessageCode: "UNAUTHORIZED" }
        : response.status === 404
        ? { data: null, errorMessageCode: "UNKNOWN_PACKAGE_ID" }
        : { data: await response.arrayBuffer(), errorMessageCode: null };

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

  async function user({
    packageID,
    UPNKey,
    userID,
  }: {
    packageID: string;
    UPNKey: string;
    userID: string;
  }) {
    const response = await api({
      path: `/process/${packageID}/user/${userID}`,
      method: "GET",
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${UPNKey}`,
      },
    });

    const data: PackageAPIUserResponse =
      response.status === 401
        ? { errorMessageCode: "UNAUTHORIZED" }
        : response.status === 404
        ? { errorMessageCode: "UNKNOWN_USER_ID" }
        : response.status === 429
        ? { errorMessageCode: "RATE_LIMITED" }
        : response.status === 500
        ? { errorMessageCode: "FETCH_ERROR" }
        : { ...(await response.json()), errorMessageCode: null };

    return data;
  }

  return { process, status, data, remove, user };
}
