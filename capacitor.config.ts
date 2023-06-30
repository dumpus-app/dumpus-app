import { CapacitorConfig } from "@capacitor/cli";
import os, { NetworkInterfaceInfo } from "node:os";

function localIpAddress() {
  const interfaces = Object.values(os.networkInterfaces()).filter(
    (iface) => iface !== undefined
  ) as NetworkInterfaceInfo[][];
  const aliases = interfaces
    .filter((iface) =>
      iface.some((alias) => alias.family === "IPv4" && !alias.internal)
    )
    .map((iface) => {
      iface = iface.filter(
        (alias) => alias.family === "IPv4" && !alias.internal
      );
      return iface;
    })
    .flat();
  const ipAddress = aliases.find(
    (alias) => !alias.address.startsWith("172")
  )?.address;

  if (!ipAddress) {
    throw new Error("No suitable network interface found.");
  }

  return ipAddress;
}

const isDev = process.env.NODE_ENV === "development" || false;
if (isDev) {
  console.log(localIpAddress());
}

export default {
  appId: "app.dumpus.app",
  appName: "Dumpus",
  ...(isDev
    ? {
        server: {
          url: `http://${localIpAddress()}:3000`,
          cleartext: true,
        },
      }
    : {
        webDir: "dist",
      }),
} satisfies CapacitorConfig;
