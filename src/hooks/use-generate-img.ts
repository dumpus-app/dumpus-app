"use client";

import { useCallback } from "react";
import { FALLBACK_AVATAR } from "~/components/share/ShareCardFrame";

let fallbackAvatar: Promise<string> | undefined;

/** The fallback avatar as a data URL, the only kind an SVG image can show. */
function fallbackAvatarDataURL() {
  fallbackAvatar ??= fetch(FALLBACK_AVATAR)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }),
    );
  return fallbackAvatar;
}

function imagesSettled(node: HTMLElement, timeout: number) {
  const pending = Array.from(node.querySelectorAll("img")).filter(
    (image) => !image.complete,
  );
  return Promise.race([
    Promise.all(
      pending.map(
        (image) =>
          new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, timeout)),
  ]);
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Draws a share card into a PNG with `modern-screenshot`, which has the
 * WebView paint the card's DOM into an SVG `<foreignObject>`, then a canvas,
 * so the image comes out as the preview looks.
 */
export default function useGenerateImg() {
  const generate = useCallback(async function (
    node: HTMLElement,
    { width, height }: { width: number; height: number },
  ) {
    const [{ domToBlob }, placeholderImage] = await Promise.all([
      // Its own chunk, loaded the first time someone shares.
      import("modern-screenshot"),
      fallbackAvatarDataURL().catch(() => undefined),
    ]);

    await document.fonts.ready;
    // An avatar that fails swaps to the fallback in the preview: let React
    // render the swap and the new image load before the card is cloned.
    for (let i = 0; i < 2; i++) {
      await imagesSettled(node, 5_000);
      await nextFrame();
      await nextFrame();
    }

    return domToBlob(node, {
      width,
      height,
      scale: 1,
      type: "image/png",
      // WebKit can draw an image of the SVG before it has decoded it, and
      // leave it out: drawing again after this many ms puts it back.
      drawImageInterval: 100,
      timeout: 10_000,
      fetch: { placeholderImage },
    });
  }, []);

  return { generate };
}
