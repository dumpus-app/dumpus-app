# Developing Dumpus

## Local setup

- Node.js >= `v16.17.0`
- PNPM >= `8.0.0`
- Visual Studio Code

If you plan on developing more specific parts of the app, follow their respective guides:

- Android: https://capacitorjs.com/docs/android
- iOS: https://capacitorjs.com/docs/ios
- Tauri: https://tauri.app/v1/guides/getting-started/prerequisites

Otherwise, just run the right commands and you'll be guided

## Tech stack

The app is made, at its core, from a web application using:

- React
- Next.js 13 (App directory)
- Tailwind CSS
- React Query
- Zustand

It's bundled as an SPA and is embedded on mobile and desktop thanks to:

- Capacitor on Android and iOS
- Tauri on desktop (Linux/Mac/Windows)

## Getting started

Our `package.json` scripts section can be a bit intimidating so here is the essential.

### Developing the web app

Just run `pnpm dev` and open your browser at `http://localhost:3000`!

### Developing the android app

You need to run 2 processes in parallel:

- `pnpm run dev:mobile` to start the web server
- `pnpm android:dev` to install the debug apk on your device (or emulator)

This setup enables Hot-Module Replacement (HMR) and is really convenient to debug. You can update the code and it will refresh automatically.

To debug:

- Open a Chromium-based browser
- Go to `chrome://inspect#devices`
- When your device appears, click on `Inspect`

### Developing the ios app

You need to run 2 processes in parallel:

- `pnpm run dev:mobile` to start the web server
- `pnpm ios:dev` to install the debug dmg on your device (or emulator)

This setup enables Hot-Module Replacement (HMR) and is really convenient to debug. You can update the code and it will refresh automatically.

To debug, read the [Capacitor docs](https://capacitorjs.com/docs/vscode/debugging#use-safari).

### Developing the desktop app

Run `pnpm dev:tauri` and that's it!
