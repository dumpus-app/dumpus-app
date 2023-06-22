import CRC32 from "crc-32";
import type { Range } from "~/types";
import tailwindColors from "tailwindcss/colors";

const fallbackAvatarURLsMap = new Map<string, string>();

export function avatarURLFallback(url: string | undefined, id: string) {
  if (url) return url;

  let storedFallback = fallbackAvatarURLsMap.get(id);
  if (storedFallback) return storedFallback;

  function getNumber(str: string): Range<0, 6> {
    const hash = CRC32.str(str);
    return (Math.abs(hash) % 6) as any; // Modulo 6 to get a number between 0-5
  }
  const template = (n: number) =>
    `https://cdn.discordapp.com/embed/avatars/${n}.png`;

  storedFallback = template(getNumber(id));
  fallbackAvatarURLsMap.set(id, storedFallback);

  return storedFallback;
}

const iconsColorsMap = new Map<string, string>();

export function iconColor(id: string) {
  let storedColor = iconsColorsMap.get(id);
  if (storedColor) return storedColor;

  function getNumber(str: string): Range<0, 17> {
    const hash = CRC32.str(str);
    return (Math.abs(hash) % 17) as any; // Modulo 17 to get a number between 0-16
  }

  const {
    red,
    orange,
    amber,
    yellow,
    lime,
    green,
    emerald,
    teal,
    cyan,
    sky,
    blue,
    indigo,
    violet,
    purple,
    fuchsia,
    pink,
    rose,
  } = tailwindColors;

  const colors = [
    red,
    orange,
    amber,
    yellow,
    lime,
    green,
    emerald,
    teal,
    cyan,
    sky,
    blue,
    indigo,
    violet,
    purple,
    fuchsia,
    pink,
    rose,
  ];

  const shades300 = colors.map((color) => color[300]);

  storedColor = shades300[getNumber(id)];
  iconsColorsMap.set(id, storedColor);

  return storedColor;
}
