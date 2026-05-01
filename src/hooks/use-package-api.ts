"use client";

import { DEFAULT_PACKAGE_API_URL } from "~/constants";
import type {
  PackageAPIBlobResponse,
  PackageAPIDataResponse,
  PackageAPIProcessResponse,
  PackageAPIRemoveResponse,
  PackageAPIStatusResponse,
  PackageAPIUserResponse,
} from "~/types/package-api";
import { decryptPackageBlob } from "~/utils/crypto";

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
  }): Promise<PackageAPIDataResponse> {
    // /blob returns a presigned S3 URL the client downloads directly,
    // bypassing the API Gateway slow path. The blob is encrypted; we
    // decrypt here using the UPN so the key never reaches the server.
    // Demo packages are unencrypted (iv=null).
    const blobResponse = await api({
      path: `/process/${packageID}/blob`,
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${UPNKey}`,
      },
    });

    if (blobResponse.status === 401) {
      return { data: null, errorMessageCode: "UNAUTHORIZED" };
    }
    if (blobResponse.status === 404) {
      return { data: null, errorMessageCode: "UNKNOWN_PACKAGE_ID" };
    }
    if (!blobResponse.ok) {
      throw new Error(`/blob ${packageID} failed: HTTP ${blobResponse.status}`);
    }

    const { url, iv } = (await blobResponse.json()) as PackageAPIBlobResponse;

    const objectResponse = await fetch(url);
    if (!objectResponse.ok) {
      throw new Error(
        `presigned download for ${packageID} failed: HTTP ${objectResponse.status}`,
      );
    }
    const downloaded = await objectResponse.arrayBuffer();

    const decrypted = iv
      ? await decryptPackageBlob(downloaded, iv, UPNKey)
      : downloaded;

    return { data: decrypted, errorMessageCode: null };
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
