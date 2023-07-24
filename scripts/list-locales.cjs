const fsp = require("fs/promises");
const path = require("node:path");

/**
 * @param str {string}
 * @returns {string}
 */
function getTemplate(str) {
  return str.replace(/(\r\n|\n|\r)/gm, "");
}

async function main() {
  const fileNames = await fsp.readdir(path.resolve("./locales/"));
  const locales = fileNames
    .map((name) => name.split(".")[0])
    .filter((name) => name !== "en");

  const content = `export const _locales = ${JSON.stringify(locales)};`;
  const template = getTemplate(content);

  await fsp.writeFile(
    path.resolve("./src/i18n/_locales.ts"),
    template,
    "utf-8",
  );
}

main();
