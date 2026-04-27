const { exec } = require("node:child_process");

require("dotenv").config();

const { ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_HOME_PATH } =
  process.env;

const keystoreAlias = process.env.ANDROID_KEYSTORE_ALIAS || "upload";
const androidReleaseType = process.env.ANDROID_RELEASE_TYPE || "AAB";

const command = `cross-env-shell ${
  ANDROID_HOME_PATH ? `ANDROID_HOME_PATH="${ANDROID_HOME_PATH}"` : ""
} NODE_ENV=production pnpm cap build android --keystorepath ${ANDROID_KEYSTORE_PATH} --keystorepass '${ANDROID_KEYSTORE_PASSWORD}' --keystorealias ${keystoreAlias} --keystorealiaspass '${ANDROID_KEYSTORE_PASSWORD}' --androidreleasetype ${androidReleaseType}`;

const npmProcess = exec(command);

npmProcess.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

npmProcess.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

npmProcess.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});
