const { exec } = require("node:child_process");
const path = require("path");

require("dotenv").config();

const ANDROID_KEYSTORE_PATH = process.env.ANDROID_KEYSTORE_PATH;
const ANDROID_KEYSTORE_PASSWORD = process.env.ANDROID_KEYSTORE_PASSWORD;

const ANDROID_HOME_PATH = process.env.ANDROID_HOME_PATH;

const keystoreAlias = process.env.ANDROID_KEYSTORE_ALIAS || "upload";
const androidReleaseType = process.env.ANDROID_RELEASE_TYPE || "AAB";

console.log("Run pnpm build:mobile first");

const command = `cross-env-shell ${ANDROID_HOME_PATH ? `ANDROID_HOME_PATH="${ANDROID_HOME_PATH}"` : ''} NODE_ENV=production pnpm cap build android --keystorepath ${ANDROID_KEYSTORE_PATH} --keystorepass '${ANDROID_KEYSTORE_PASSWORD}' --keystorealias ${keystoreAlias} --keystorealiaspass '${ANDROID_KEYSTORE_PASSWORD}' --androidreleasetype ${androidReleaseType}`;

const outputPath = `./android/app/build/outputs/apk/release`;

const outputUnsignedFilePath = path.join(outputPath, `app-release-unsigned.apk`);
const outputApkSignedFilePath = path.join(outputPath, `app-release-apksigner-signed.apk`);

const signCommand = `cp ${outputUnsignedFilePath} ${outputApkSignedFilePath} && apksigner sign --ks ${ANDROID_KEYSTORE_PATH} --ks-key-alias ${keystoreAlias} --ks-pass pass:${ANDROID_KEYSTORE_PASSWORD} --key-pass pass:${ANDROID_KEYSTORE_PASSWORD} ${outputApkSignedFilePath}`;

// Execute the npm script
const npmProcess = exec(command);

// Listen for output from the child process
npmProcess.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

// Listen for error output from the child process
npmProcess.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Listen for the child process to exit
npmProcess.on("close", (code) => {
  console.log(`child process exited with code ${code}`);

  if (code === 0) {
    const signProcess = exec(signCommand);
    signProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });
    signProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });
    signProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
});