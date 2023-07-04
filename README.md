# [👨‍💻 Dumpus (Stats for Discord)](https://play.google.com/store/apps/details?id=app.dumpus.app)

Dumpus is a cross-platform app that gives you advanced statistics on your Discord account. The application analyzes your "Discord Data Package", which you can request in the Discord application settings.

## Download

<a href="https://play.google.com/store/apps/details?id=app.dumpus.app"><img src="./.github/assets/playstore.png" hspace="10" height="100px" /></a>
<a href="#"><img src="./.github/assets/appstore.png" height="100px" /></a>

## What's new?

This app is the v2 of the existing [Discord Data Package Explorer](https://ddpe.androz2091.fr). You can see the improvements below:


| Feature | Dumpus | DDPE |
| --- | --- | --- |
| **100% open source** | ✅ | ✅ |
| **Easy to understand (user-friendly)** | ✅ | 🟠 (quite confusing interface) |
| **Cross-platform** | ✅ | ❌ (web only) |
| **Server-side processing** | ✅ | ❌ (only work on really powerful devices) |
| **Advanced statistics** | ✅ | ❌ (only basic analysis) |

## Screenshots

| | | |
| --- | --- | --- |
| <img src="./.github/assets/screenshot1.png" height="400px" /> | <img src="./.github/assets/screenshot2.png" height="400px" /> | <img src="./.github/assets/screenshot3.png" height="400px" /> |

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

### Setup Auto

#### Android

* Generate keystore to base64 `base64 -w 0 yourkeystore.jks > keystore_base64.txt`. Store this in the secret.
