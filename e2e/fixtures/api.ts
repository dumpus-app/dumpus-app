import type { BrowserContext, Route } from "@playwright/test";
import { md5, type Dataset } from "./dataset";

// In-memory stand-in for https://api.dumpus.app, its presigned S3 downloads
// and the Discord CDN. Response shapes follow `api/src/app.py`.

const API_ORIGIN = "https://api.dumpus.app";
const BLOB_ORIGIN = "https://dumpus-packages.s3.eu-west-1.amazonaws.com";
const CDN_ORIGIN = "https://cdn.discordapp.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const CORS = { "access-control-allow-origin": "*" };
// Every avatar and guild icon, a transparent pixel.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

export type Package = { dataset: Dataset; blob: Buffer; iv: string | null };

type ProcessingStep = "LOCKED" | "DOWNLOADING" | "ANALYZING" | "PROCESSED";

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
  /** Requests to hosts no mock stands in for, the test fails if any. */
  readonly unexpected: string[] = [];

  constructor(private readonly packages: Package[]) {}

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
    await context.route(`${CDN_ORIGIN}/**`, (route) =>
      route.fulfill({ headers: CORS, contentType: "image/png", body: PNG }),
    );
  }

  private api(route: Route) {
    const request = route.request();
    const method = request.method();
    const { pathname } = new URL(request.url());
    const authorization = request.headers()["authorization"];

    const [resource, id, ...rest] = pathname.split("/").filter(Boolean);
    const action = rest.join("/");

    if (method === "POST" && pathname === "/process") {
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
        return json(route, this.statusBody());
      }
      if (method === "GET" && action === "blob") {
        return json(route, this.blobBody(pkg));
      }
      if (method === "GET" && rest[0] === "user" && rest.length === 2) {
        const user = pkg.dataset.apiUsers.get(rest[1]);
        return user ? json(route, user) : empty(route, 500);
      }
    }

    // Flask's 404 handler.
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
    const base = { ...baseStatus(), processingStep: this.step };
    if (this.step === "PROCESSED") return { ...base, isDataAvailable: true };
    return {
      ...base,
      isProcessing: true,
      processingQueuePosition: {
        ...base.processingQueuePosition,
        premiumQueueTotal: 0,
        standardQueueTotal: 12,
        premiumQueueUser: 0,
        standardQueueUser: 3,
        standardWhenJoined: 12,
        premiumWhenJoined: 0,
      },
    };
  }

  private blob(route: Route) {
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
}
