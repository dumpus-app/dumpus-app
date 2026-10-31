#!/bin/sh
# Runs the e2e suite in the Playwright image CI uses, to reproduce on a Mac
# what fails on Linux only. Arguments go to `playwright test`, for eg.
# `pnpm test:e2e:docker --project mobile`.
set -e

version=$(node -p "require('@playwright/test/package.json').version")

# A volume keeps the Linux node_modules, and the pnpm store with them, apart
# from the host's. pnpm would also leave a `node-compile-cache` folder in the
# project.
exec docker run --rm --init --ipc=host \
  --volume "$PWD":/work --workdir /work \
  --volume dumpus-app-e2e-node-modules:/work/node_modules \
  --env pnpm_config_store_dir=/work/node_modules/.pnpm-store \
  --env NODE_COMPILE_CACHE=/tmp/node-compile-cache \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c 'corepack enable && pnpm install --frozen-lockfile && pnpm test:e2e "$@"' \
  sh "$@"
