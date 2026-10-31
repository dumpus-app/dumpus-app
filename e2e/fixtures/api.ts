import type { BrowserContext, Route } from "@playwright/test";
import { md5, type Dataset } from "./dataset";
import { placeholderPng } from "./png";

// In-memory stand-in for https://api.dumpus.app, its presigned S3 downloads
// and the Discord CDN. Response shapes follow dumpus-api's `src/app.py`.

export const API_ORIGIN = "https://api.dumpus.app";
const BLOB_ORIGIN = "https://dumpus-packages.s3.eu-west-1.amazonaws.com";
const CDN_ORIGIN = "https://cdn.discordapp.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const CORS = { "access-control-allow-origin": "*" };

export type Package = { dataset: Dataset; blob: Buffer; iv: string | null };

type ProcessingStep = "LOCKED" | "DOWNLOADING" | "ANALYZING" | "PROCESSED";

export type StatusError =
  | "UNKNOWN_ERROR"
  | "EXPIRED_LINK"
  | "INVALID_LINK"
  | "MISSING_USER_DATA";

type Held = "process" | "status" | "blob";

type ApiCall = {
  method: string;
  path: string;
  authorization: string | undefined;
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: CORS,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function empty(route: Route, status: number) {
  return route.fulfill({ status, headers: CORS, body: "" });
}

/** `get_base_status_response()` */
function baseStatus() {
  return {
    isDataAvailable: false,
    isUpgraded: false,
    isErrored: false,
    errorMessageCode: null as string | null,
    isProcessing: false,
    processingStep: null as string | null,
    processingQueuePosition: {
      user: 0,
      total: 0,
      userWhenStarted: 0,
      totalWhenStarted: 0,
    },
  };
}

export class FakeApi {
  /** What `/status` reports for every package. */
  step: ProcessingStep = "PROCESSED";
  queuePosition = 3;
  statusError: StatusError | null = null;
  readonly calls: ApiCall[] = [];
  /** Requests to hosts no mock stands in for, the test fails if any. */
  readonly unexpected: string[] = [];

  private readonly holds = new Map<Held, Promise<void>>();
  private readonly releases: (() => void)[] = [];
  private readonly images = new Map<string, Buffer>();

  constructor(private readonly packages: Package[]) {}

  /** Keeps `endpoint` from answering until the returned function is called. */
  hold(endpoint: Held) {
    let release!: () => void;
    this.holds.set(
      endpoint,
      new Promise<void>((resolve) => {
        release = () => {
          this.holds.delete(endpoint);
          resolve();
        };
      }),
    );
    this.releases.push(release);
    return release;
  }

  releaseAll() {
    for (const release of this.releases) release();
  }

  async install(context: BrowserContext) {
    // Registered first so every route below takes precedence over it.
    await context.route(
      (url) => !LOCAL_HOSTS.has(url.hostname),
      (route) => {
        this.unexpected.push(
          `${route.request().method()} ${route.request().url()}`,
        );
        return route.abort("blockedbyclient");
      },
    );
    await context.route(`${API_ORIGIN}/**`, (route) => this.api(route));
    await context.route(`${BLOB_ORIGIN}/**`, (route) => this.blob(route));
    await context.route(`${CDN_ORIGIN}/**`, (route) => this.cdn(route));
  }

  private async api(route: Route) {
    const request = route.request();
    const method = request.method();
    const { pathname } = new URL(request.url());
    const authorization = request.headers()["authorization"];
    this.calls.push({ method, path: pathname, authorization });

    const [resource, id, ...rest] = pathname.split("/").filter(Boolean);
    const action = rest.join("/");

    if (method === "POST" && pathname === "/process") {
      await this.holds.get("process");
      const link = request.postDataJSON().package_link;
      const pkg = this.packages.find(
        ({ dataset }) =>
          dataset.upn !== null &&
          link === `https://click.discord.com/ls/click?upn=${dataset.upn}`,
      );
      return json(
        route,
        pkg
          ? {
              isAccepted: true,
              packageId: pkg.dataset.packageId,
              errorMessageCode: null,
            }
          : {
              isAccepted: false,
              packageId: null,
              errorMessageCode: "INVALID_LINK",
            },
      );
    }

    if (method === "GET" && resource === "widget" && id && !action) {
      for (const { dataset } of this.packages) {
        const widget = dataset.widgets.get(id);
        if (widget) return json(route, widget);
      }
      return json(route, { error: "guild not found or bot lacks access" }, 404);
    }

    const pkg = this.packages.find(({ dataset }) => dataset.packageId === id);
    if (resource === "process" && pkg) {
      if (method === "GET" && action === "blob" && id === "demo") {
        return json(route, this.blobBody(pkg));
      }

      // Same rule as `check_authorization_bearer()`: the bearer is the UPN
      // whose md5 is the package id.
      const upn = authorization?.split(" ")[1];
      if (!upn || md5(upn) !== id) {
        return action === "status"
          ? json(
              route,
              { ...baseStatus(), errorMessageCode: "UNAUTHORIZED" },
              401,
            )
          : empty(route, 401);
      }

      if (method === "GET" && action === "status") {
        await this.holds.get("status");
        return json(route, this.statusBody());
      }
      if (method === "GET" && action === "blob") {
        return json(route, this.blobBody(pkg));
      }
      if (method === "GET" && rest[0] === "user" && rest.length === 2) {
        const user = pkg.dataset.apiUsers.get(rest[1]);
        return user ? json(route, user) : empty(route, 500);
      }
      if (method === "DELETE" && !action) {
        return json(route, { isDeleted: true, errorMessageCode: null });
      }
    }

    // Flask's 404 handler. The app asks for `/user/` with an empty id on a
    // details page that doesn't exist.
    return json(route, { error: "Route not found." }, 404);
  }

  private blobBody({ dataset, iv }: Package) {
    return {
      url: `${BLOB_ORIGIN}/${dataset.packageId}?X-Amz-Expires=300`,
      iv,
      ttl: 300,
    };
  }

  private statusBody() {
    const base = {
      ...baseStatus(),
      isErrored: this.statusError !== null,
      errorMessageCode: this.statusError,
      processingStep: this.step,
    };
    if (this.step === "PROCESSED") return { ...base, isDataAvailable: true };
    return {
      ...base,
      isProcessing: true,
      processingQueuePosition: {
        ...base.processingQueuePosition,
        premiumQueueTotal: 0,
        standardQueueTotal: 12,
        premiumQueueUser: 0,
        standardQueueUser: this.queuePosition,
        standardWhenJoined: 12,
        premiumWhenJoined: 0,
      },
    };
  }

  private async blob(route: Route) {
    await this.holds.get("blob");
    const id = new URL(route.request().url()).pathname.slice(1);
    const pkg = this.packages.find(({ dataset }) => dataset.packageId === id);
    if (!pkg) {
      this.unexpected.push(`GET ${route.request().url()}`);
      return empty(route, 403);
    }
    return route.fulfill({
      headers: CORS,
      contentType: "binary/octet-stream",
      body: pkg.blob,
    });
  }

  private cdn(route: Route) {
    // The share image asks for `.png` where the app shows `.webp`: same
    // avatar, same color.
    const asset = new URL(route.request().url()).pathname.replace(/\.\w+$/, "");
    let image = this.images.get(asset);
    if (!image) {
      image = placeholderPng(asset);
      this.images.set(asset, image);
    }
    return route.fulfill({
      headers: CORS,
      contentType: "image/png",
      body: image,
    });
  }
}
