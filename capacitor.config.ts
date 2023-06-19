import { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

const isDev = process.env.NODE_ENV === "development";
const PRODUCTION_URL = "https://dumpus-app.sys.dumpus.app/";

const networks = networkInterfaces();
const networkKey = "Ethernet" in networks ? "Ethernet" : "Wi-Fi"; // TODO: check if first key is enough
const network = networks[networkKey]!;
const ipAddress = network.find((e) => e.family === "IPv4")!.address;

const devURL = `http://${ipAddress}:3000`;

export default {
  appId: "app.dumpus.app",
  appName: "Dumpus",
  // webDir: "out",
  server: {
    url: isDev ? devURL : PRODUCTION_URL,
    cleartext: true,
  },
} satisfies CapacitorConfig;
