# DUMPUS APP

## Tech stack

Cross-platform app powered by:

### Web

- React and Next.js
- Tailwind CSS
- Typescript

### Mobile

- Capacitor
- Java (Android)
- Fastlane (Ruby) for CI/CD

### Desktop

- Tauri (Rust)

## Commands

- `cd android && bundle exec fastlane [lane]`

## Deployments

### Manual

#### Android

**Building**

1. Build project: `pnpm build`
2. Sync project: `pnpm cap sync`
3. Update `package.json` version
4. Update `android/app/build.gradle`
   1. Increase `android.defaultConfig.versionCode` by 1
   2. Set `android.defaultConfig.versionName` to the value of the `package.json`
5. Open Android studio: `pnpm cap open android`
6. Build AAB: `Build` > `Generate Signed Bundle or APK`
   1. Select `Android App Bundle`
   2. Set `Key Store path`, `Key Store password` and `Key password` according to data available in `dumpus-app/android-certificates`
   3. Set `Key alias` to `upload`
   4. Uncheck `Export encrypted key ...`
   5. Click on `Next`
7. Select `release` and click on `Create`
8. Get the file at `android/app/release/app-release.aab`

**Play Store**

1. ???
