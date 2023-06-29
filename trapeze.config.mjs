import { MobileProject } from "@trapezedev/project";
import packageJson from "./package.json" assert { type: "json" };

const { version } = packageJson;

/** @satisfies {import("@trapezedev/project").MobileProjectConfig} */
const config = {
  ios: {
    path: "ios/App",
  },
  android: {
    path: "android",
  },
};

async function main() {
  const project = new MobileProject(".", config);
  await project.load();

  // For type safety because we are not in a TS file
  if (!project.android || !project.ios) return;
  const { android, ios } = project;

  await android.setVersionName(version);
  await android.incrementVersionCode();

  await ios.setVersion("App", "Release", version);
  await ios.incrementBuild("App");

  await project.commit();
}

main();
