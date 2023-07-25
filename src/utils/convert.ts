import LZString from "lz-string";

export function stringToUint8Array(
  data: string,
  { decompress = true }: { decompress?: boolean } = {},
) {
  return new Uint8Array(
    JSON.parse(decompress ? LZString.decompressFromUTF16(data) : data),
  );
}

export function Uint8ArrayToString(
  data: Uint8Array,
  { compress = true }: { compress?: boolean } = {},
) {
  const str = JSON.stringify(Array.from(data));
  return compress ? LZString.compressToUTF16(str) : str;
}
