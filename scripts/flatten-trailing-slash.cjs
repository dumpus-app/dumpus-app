#!/usr/bin/env node

// Mirror every `dist/<path>/index.html` to a sibling `dist/<path>.html`.
//
// Why: next.config.mjs uses `trailingSlash: true`, so the static export
// emits routes as `dist/onboarding/index.html`. The web build serves
// these via S3 + CloudFront which knows to map `/foo/` to that file.
//
// Tauri's bundled-asset resolver does NOT do that mapping — when it's
// asked for `onboarding`, it tries:
//   1. `onboarding`        (literal file, doesn't exist)
//   2. `onboarding.html`   (fallback, doesn't exist either)
// …and gives up, leaving the WebView on a blank page where
// `Right side of assignment cannot be destructured` blows up the JS.
//
// See dumpus-app/dumpus-app#366.
//
// We could switch to `trailingSlash: false` for desktop only, but that
// would either fork the Next config or change the live web build's URLs.
// Mirroring is one small build step, contained to the Tauri pipeline.

const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");

if (!fs.existsSync(distDir)) {
  console.error(`flatten-trailing-slash: ${distDir} does not exist; did the Next build run?`);
  process.exit(1);
}

let mirrored = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip Next's internal asset tree — those are the chunks/CSS
      // referenced by absolute URLs from the HTML, not routes.
      if (entry.name === "_next" || entry.name === "static") continue;
      walk(full);
      const indexHtml = path.join(full, "index.html");
      if (fs.existsSync(indexHtml)) {
        const sibling = `${full}.html`;
        if (!fs.existsSync(sibling)) {
          fs.copyFileSync(indexHtml, sibling);
          mirrored += 1;
        }
      }
    }
  }
}

walk(distDir);

console.log(`flatten-trailing-slash: mirrored ${mirrored} index.html files for Tauri's asset resolver`);
