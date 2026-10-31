# [👨‍💻 Dumpus (Stats for Discord)](https://play.google.com/store/apps/details?id=app.dumpus.app)

> [!NOTE]
> ⚡ Dumpus now processes packages in Go: **3.7× faster** and **5× less memory**.

<details>
<summary>Before and after</summary>

|                                  | Python | Go     |
| -------------------------------- | ------ | ------ |
| Typical package (median)         | 16.8 s | 4.4 s  |
| Large packages (90th percentile) | 48.4 s | 14.9 s |
| Peak memory (median)             | 277 MB | 51 MB  |
| Start-up                         | 0.27 s | 1.1 ms |

Tested on real packages, 2 CPUs, median of 3 runs per package.

</details>

Dumpus is a cross-platform app that gives you advanced statistics on your Discord account. The application analyzes your "Discord Data Package", which you can request in the Discord application settings.

You can join [our Discord server](https://androz2091.fr/discord) to keep up to date and give us your feedback.

## Download

<a href="https://play.google.com/store/apps/details?id=app.dumpus.app" target="_blank">
<img src="./assets/playstore.svg" height="90px" />
</a>
<a href="https://apps.apple.com/us/app/dumpus-stats-for-discord/id6450952260" target="_blank">
<img src="./assets/appstore.svg" height="90px" />
</a>

or use the [web version](https://web.dumpus.app), or [Windows, macOS, Linux builds](https://github.com/Androz2091/dumpus-app/releases/latest).

## Screenshots

|                                                       |                                                       |                                                       |
| ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| <img src="./assets/screenshot1.jpg" height="400px" /> | <img src="./assets/screenshot2.jpg" height="400px" /> | <img src="./assets/screenshot3.jpg" height="400px" /> |

## Made with

<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/react/react.png"></code> **React** (front-end)  
<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/python/python.png"></code> **Python** (API)  
<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/go/go.png"></code> **Go** (package processing)  
<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png"></code> **PostgreSQL** (database)  
<code><img height="20" src="https://3776657.fs1.hubspotusercontent-na1.net/hub/3776657/hubfs/capacitor-icon.png"></code> **Capacitor** (cross-platform support)

## What's new?

This app is the v2 of the existing [Discord Data Package Explorer](https://ddpe.androz2091.fr), a.k.a **DDPE**. You can see the improvements below:

| Feature                                   | Dumpus        | DDPE                                      |
| ----------------------------------------- | ------------- | ----------------------------------------- |
| **100% open source**                      | ✅            | ✅                                        |
| **Cross-platform**                        | ✅            | ❌ (web only)                             |
| **Server-side processing**                | ✅            | ❌ (only work on really powerful devices) |
| **Advanced statistics**                   | ✅            | ❌ (only basic analysis)                  |
| **More than 10 top DMs/servers/channels** | ✅ (up to 20) | ❌ (10 max)                               |
| **Shareable stats card**                  | ✅            | ❌                                        |
| **Multi-packages handling**               | ✅            | ❌                                        |

Users that self-host the project can access unlimited top (instead of 20) for free. When using our hosted API, users can buy the `Supporter` version to get the access.

## Self-hosting

You can self-host **everything** in the project, for free. You can build the app for all the environments (mobile, web, desktop...), host your own instance of the API, the database, to keep **complete control on your data**.
[Here is a guide to self-host the app](./DEVELOPERS.md), and [one for the API](./api/README.md#self-hosting).

## Need help?

If you need help, you can join the [Discord server](https://androz2091.fr/discord) or open an issue.
