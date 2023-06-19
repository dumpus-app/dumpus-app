import { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

const isDev = process.env.NODE_ENV === "development" || false;
const networks = networkInterfaces();
const networkKey = "Ethernet" in networks ? "Ethernet" : "Wi-Fi";
const network = networks[networkKey]!;
const ipAddress = network.find((e) => e.family === "IPv4")!.address;

export default {
  appId: "app.dumpus.app",
  appName: "Dumpus",
  webDir: "dist",
  server: isDev
    ? {
        url: `http://${ipAddress}:3000`,
        cleartext: true,
      }
    : undefined,
} satisfies CapacitorConfig;
