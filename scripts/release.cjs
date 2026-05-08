#!/usr/bin/env node

// Bump the version, run trapeze to bump iOS bundle + Android versionCode
// in lockstep, and create a single commit. Designed to take the manual
// steps out of cutting a release without surprising the human about
// destructive things (push, tag, GH release) — those stay manual.
//
// Usage:
//   pnpm release:patch    1.0.7 -> 1.0.8
//   pnpm release:minor    1.0.7 -> 1.1.0
//   pnpm release:major    1.0.7 -> 2.0.0
//
// What it does:
//   - Refuses to run on a dirty working tree (so the commit only contains
//     the bump).
//   - Bumps package.json version per the requested level.
//   - Runs `pnpm trapeze:run` (which bumps Android versionCode + iOS
//     CFBundleVersion and copies the new versionName / MARKETING_VERSION
//     into both projects).
//   - Stages exactly the release-touched files and creates one commit:
//       chore(release): X.Y.Z
//
// What it deliberately doesn't do:
//   - Push (you control timing).
//   - Tag (`gh release create vX.Y.Z` does that as a side effect).
//   - Create the GitHub Release (that's what triggers the platform build
//     workflows — leaving it manual keeps deploy timing in your hands).

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const LEVEL = process.argv[2];
if (!["patch", "minor", "major"].includes(LEVEL)) {
  console.error(
    `usage: node scripts/release.cjs <patch|minor|major>\n  got: ${LEVEL ?? "(none)"}`,
  );
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: repoRoot, stdio: "inherit" });
}

function out(cmd) {
  return execSync(cmd, { cwd: repoRoot, encoding: "utf8" }).trim();
}

// 1. Insist on a clean tree so the release commit only contains the bump.
const dirty = out("git status --porcelain");
if (dirty) {
  console.error(
    "Working tree is dirty — commit or stash everything before releasing.\n" +
      dirty,
  );
  process.exit(1);
}

// 1a. Insist on being on main. Both v1.0.10 and v1.0.11 misfired because
// `pnpm release:patch` was run on a feature branch — the bump commit went
// there, the GH Release was cut against main HEAD which still had the
// previous version, and platform workflows built artifacts under the new
// tag with the OLD version's code. Catching this here is the cheapest
// possible save.
const currentBranch = out("git rev-parse --abbrev-ref HEAD");
if (currentBranch !== "main") {
  console.error(
    `Refusing to release from branch '${currentBranch}'. Releases must come\n` +
      `from main so the tag, the GitHub Release, and the platform builds all\n` +
      `agree on which code is being shipped. Run:\n` +
      `\n` +
      `  git checkout main\n` +
      `  git pull --ff-only\n` +
      `  pnpm release:${LEVEL}\n`,
  );
  process.exit(1);
}

// 1b. Insist on local main being in sync with origin/main. Otherwise the
// release commit could land on top of stale code, and a subsequent
// `git push` would either fast-forward (fine) or be rejected (annoying)
// — but worse, if you cut the GH Release between bump-commit and push,
// workflows still build the wrong thing.
run("git fetch origin main --quiet");
const localHead = out("git rev-parse HEAD");
const remoteHead = out("git rev-parse origin/main");
if (localHead !== remoteHead) {
  console.error(
    `Local main (${localHead.slice(0, 7)}) is out of sync with origin/main (${remoteHead.slice(0, 7)}).\n` +
      `Pull (or push your local commits) so they match, then re-run.`,
  );
  process.exit(1);
}

// 2. Bump package.json — straight JSON edit avoids npm/pnpm version's
// side effects (auto-tag, auto-commit, lockfile rewrite, etc.).
const pkgPath = path.join(repoRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const next =
  LEVEL === "patch"
    ? `${major}.${minor}.${patch + 1}`
    : LEVEL === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major + 1}.0.0`;
console.log(`bumping ${pkg.version} -> ${next}`);
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 3. Trapeze reads version from package.json and writes both platforms.
run("pnpm trapeze:run");

// 4. Stage exactly the files trapeze touches plus package.json itself,
// and commit. (Avoid `git add -A` so any unrelated working-tree noise
// doesn't sneak in — though step 1 already guarantees there is none.)
run(
  "git add package.json android/app/build.gradle ios/App/App.xcodeproj/project.pbxproj ios/App/App/Info.plist",
);
run(`git commit -m "chore(release): ${next}"`);

// 5. Print the next steps so they're not magic.
console.log("");
console.log(`Release commit ready. To ship v${next}:`);
console.log(`  git push`);
console.log(`  gh release create v${next} --generate-notes`);
console.log("");
console.log(
  "(`gh release create` is what triggers the platform build/deploy workflows.)",
);
