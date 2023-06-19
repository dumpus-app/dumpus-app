import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

const assetUrl =
  "https://raw.githubusercontent.com/dumpus-app/sql.js/dist/sql-wasm.wasm";
const localPath = path.join(process.cwd(), "./public/sqljs/sql-wasm.wasm");

const localDir = path.dirname(localPath);
fs.mkdirSync(localDir, { recursive: true });

fetch(assetUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const writeStream = fs.createWriteStream(localPath);
    response.body.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log("File downloaded and saved successfully!");
    });

    writeStream.on("error", (error) => {
      console.error("Error writing the file:", error);
    });
  })
  .catch((error) => {
    console.error("Error downloading the file:", error);
  });
