"use client";

import { useRef } from "react";
import initSqlJs from "sql.js";
import { useShallow } from "zustand/react/shallow";
import packageAPI from "~/hooks/use-package-api";
import { useAppStore } from "~/stores";
import type { PackageData } from "~/types/sql";
import {
  getPackageBytes,
  isQuotaError,
  legacyKey,
  legacyPackageIDs,
  migrateLegacyPackage,
  putPackageBytes,
} from "~/utils/db-storage";
import { createLogger } from "~/utils/logger";
import { resultAsList } from "~/utils/sql";

/** The `localStorage` key of a package's database, before IndexedDB. */
export { legacyKey as getStorageKey } from "~/utils/db-storage";

const logger = createLogger({ tag: "package" });

// The packages other than the one opened move from `localStorage` once per
// session, see `open`.
let movedOthers = false;

export type PackageLoadErrorCode =
  "STORAGE_FULL" | "UNKNOWN_PACKAGE_ID" | "UNAUTHORIZED" | "UNKNOWN_ERROR";

/** Why a package couldn't be opened, for the screen that says so. */
export class PackageLoadError extends Error {
  readonly code: PackageLoadErrorCode;

  constructor(code: PackageLoadErrorCode) {
    super(code);
    this.name = "PackageLoadError";
    this.code = code;
  }
}

export function loadErrorCode(err: unknown): PackageLoadErrorCode {
  if (err instanceof PackageLoadError) return err.code;
  if (isQuotaError(err)) return "STORAGE_FULL";
  return "UNKNOWN_ERROR";
}

/** The SQLite bytes of a downloaded package, which the API gzips. */
async function inflate(gzipped: ArrayBuffer) {
  if (typeof DecompressionStream === "function") {
    try {
      const stream = new Response(gzipped).body!.pipeThrough(
        new DecompressionStream("gzip"),
      );
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (err) {
      logger.warn("DecompressionStream failed, trying pako", err);
    }
  }
  // Safari before 16.4 has no `DecompressionStream`.
  const { inflate } = await import("pako");
  return inflate(new Uint8Array(gzipped));
}

export default function useSQLInit() {
  const {
    packages,
    setSelectedID,
    addPackage,
    setPackage,
    setDB,
    setTimeRange,
  } = useAppStore(
    useShallow(
      ({
        config: {
          packages,
          setSelectedID,
          addPackage,
          setPackage,
          setTimeRange,
        },
        database: { setDB },
      }) => ({
        packages,
        setSelectedID,
        addPackage,
        setPackage,
        setDB,
        setTimeRange,
      }),
    ),
  );

  const isInitializedRef = useRef(false);

  /**
   * The bytes of package `id`, from IndexedDB, else from `localStorage`, where
   * the app kept them before (moving them over on the way), else downloaded
   * again with the package's key, for when the device cleared its storage.
   */
  async function readPackage(id: string) {
    const stored = await getPackageBytes(id).catch((err) => {
      logger.error("IndexedDB read failed", err);
      return null;
    });
    if (stored) return stored;

    const legacy = await migrateLegacyPackage(id).catch((err) => {
      logger.error("localStorage read failed", err);
      return null;
    });
    // IndexedDB refused it, so it would refuse the others too.
    if (legacy && !legacy.moved) movedOthers = true;
    if (legacy) return legacy.bytes;

    const pkg = packages.find((pkg) => pkg.id === id);
    if (!pkg) throw new PackageLoadError("UNKNOWN_PACKAGE_ID");
    logger.info(`package ${id} isn't on this device, downloading it again`);
    const { data, errorMessageCode } = await packageAPI({
      baseURL: pkg.backendURL,
    }).data({ packageID: pkg.package_id, UPNKey: pkg.UPNKey });
    if (!data) throw new PackageLoadError(errorMessageCode ?? "UNKNOWN_ERROR");

    const bytes = await inflate(data);
    // Opened from memory if it can't be kept: the next start downloads again.
    await putPackageBytes(id, bytes).catch((err) => logger.error(err));
    return bytes;
  }

  async function open({
    id,
    initData,
  }: {
    id: string;
    initData?: {
      initialData: ArrayBuffer;
      packageLink: string;
      UPNKey: string;
      backendURL: string;
    };
  }) {
    const existingPackage = packages.find(
      (pkg) => pkg.packageLink === initData?.packageLink,
    );
    if (existingPackage) {
      id = existingPackage.id;
    }

    let data: Uint8Array;
    if (initData) {
      data = await inflate(initData.initialData);
      // Throws when the device can't keep it, for eg. a full disk.
      await putPackageBytes(id, data);
      // The same link imported again replaces its old copy.
      localStorage.removeItem(legacyKey(id));
    } else {
      data = await readPackage(id);
      // The other packages still in `localStorage` move over on this start
      // too, so their old entries stop filling it, until IndexedDB refuses one.
      if (!movedOthers) {
        movedOthers = true;
        for (const other of legacyPackageIDs()) {
          if (other === id || !packages.some((pkg) => pkg.id === other)) {
            continue;
          }
          const legacy = await migrateLegacyPackage(other).catch((err) => {
            logger.error(err);
            return null;
          });
          if (legacy && !legacy.moved) break;
        }
      }
    }

    const { Database } = await initSqlJs({
      locateFile: (file) => `/wasm/${file}`,
    });
    const _db = new Database(data);

    if (initData) {
      const dateAdded = new Date().toISOString();
      const packageData = resultAsList<PackageData>(
        _db.exec("SELECT * FROM package_data LIMIT 1;")[0],
      )[0];

      const newPackage = {
        id,
        packageLink: initData.packageLink,
        UPNKey: initData.UPNKey,
        dateAdded,
        backendURL: initData.backendURL,
        ...packageData,
      };
      if (existingPackage) {
        setPackage(existingPackage.id, newPackage);
      } else {
        addPackage(newPackage);
      }
      setSelectedID(id);
      setTimeRange("lifetime");
    }
    setDB(_db);
  }

  /**
   * Opens package `id` as the app's database: the one just downloaded when
   * `initData` is given, which is stored first, else the stored one. Rejects
   * when it can't, see `loadErrorCode`.
   */
  async function init(options: Parameters<typeof open>[0]) {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    try {
      await open(options);
    } catch (err) {
      // So the screen that shows the error can try again.
      isInitializedRef.current = false;
      throw err;
    }
  }

  return { init };
}
