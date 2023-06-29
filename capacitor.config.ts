import { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

const isDev = process.env.NODE_ENV === "development" || false;
const networks = networkInterfaces();

let ipAddress;

for (let network of Object.values(networks)) {
  for (let netInfo of network!) {
    if (netInfo.family === "IPv4" && !netInfo.internal) {
      ipAddress = netInfo.address;
      break;
    }
  }

  if (ipAddress) {
    break;
  }
}

if (!ipAddress) {
  throw new Error("No suitable network interface found.");
}

export default {
  appId: "app.dumpus.app",
  appName: "Dumpus",
  ...(isDev
    ? {
        server: {
          url: `http://${ipAddress}:3000`,
          cleartext: true,
        },
      }
    : {
        webDir: "dist",
      }),
} satisfies CapacitorConfig;
