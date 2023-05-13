import { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

const ipAddress = networkInterfaces().Ethernet!.find(
  (e) => e.family === "IPv4"
)!.address;

const url = `http://${ipAddress}:3000`;
console.log(`Launching on ${url}`);

const config: CapacitorConfig = {
  appId: "net.dumpusapp.app",
  appName: "Dumpus",
  webDir: "out",
  server: {
    androidScheme: "https",
    url,
    cleartext: true,
  },
};

export default config;
