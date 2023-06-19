import CRC32 from "crc-32";

const fallbackAvatarURLsMap = new Map<string, string>();

export function avatarURLFallback(url: string | undefined, id: string) {
  if (url) return url;

  let storedFallback = fallbackAvatarURLsMap.get(id);
  if (storedFallback) return storedFallback;

  function getNumber(str: string) {
    const hash = CRC32.str(str);
    return Math.abs(hash) % 6; // Modulo 6 to get a number between 0-5
  }
  const template = (n: number) =>
    `https://cdn.discordapp.com/embed/avatars/${n}.png`;

  storedFallback = template(getNumber(id));
  fallbackAvatarURLsMap.set(id, storedFallback);

  return storedFallback;
}
