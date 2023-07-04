import LZString from "lz-string";

export function stringToUint8Array(data: string) {
  return new Uint8Array(JSON.parse(LZString.decompressFromUTF16(data)));
}

export function Uint8ArrayToString(data: Uint8Array) {
  return LZString.compressToUTF16(JSON.stringify(Array.from(data)));
}
