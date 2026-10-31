// Opens a package blob the way the app does, to check the envelope from the
// client's side: `decryptPackageBlob` is copied from the app's
// `src/utils/crypto.ts`, and the inflate and sql.js steps follow
// `src/hooks/use-sql-init.ts`.
//
//   node open-blob.mjs <blob file> [<iv hex> <upn>]
//
// Without an iv the blob is opened as is, like the demo. Prints the row count
// of every table and the `package_data` row, as JSON.
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import pako from "pako";
import initSqlJs from "sql.js";

const { subtle } = globalThis.crypto ?? webcrypto;

function hexToBytes(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error(`invalid iv hex length: ${hex.length}`);
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function decryptPackageBlob(encrypted, ivHex, upnKey) {
  const iv = hexToBytes(ivHex);
  if (iv.length !== 16) {
    throw new Error(`expected 16-byte iv, got ${iv.length}`);
  }

  const upnBytes = new TextEncoder().encode(upnKey);
  const keyDigest = await subtle.digest("SHA-256", upnBytes);
  const key = await subtle.importKey("raw", keyDigest, { name: "AES-CBC" }, false, ["decrypt"]);

  return subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
}

const [blobPath, ivHex, upnKey] = process.argv.slice(2);
const file = await readFile(blobPath);
// What `fetch(url).arrayBuffer()` hands the app.
const downloaded = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const decrypted = ivHex ? await decryptPackageBlob(downloaded, ivHex, upnKey) : downloaded;

const data = pako.inflate(decrypted);
const { Database } = await initSqlJs();
const db = new Database(data);

const tables = {};
const [names] = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;");
for (const [name] of names.values) {
  tables[name] = db.exec(`SELECT COUNT(*) FROM "${name}";`)[0].values[0][0];
}
const [packageData] = db.exec("SELECT * FROM package_data LIMIT 1;");
const row = Object.fromEntries(packageData.columns.map((column, i) => [column, packageData.values[0][i]]));

console.log(JSON.stringify({ tables, package_data: row }));
