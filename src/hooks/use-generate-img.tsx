"use client";

import * as resvg from "@resvg/resvg-wasm";
import { useState } from "react";
import satori, { Font, init as initSatori } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import StaticShareImage, {
  type Props as StaticShareImageProps,
} from "~/components/StaticShareImage";
import { useAppStore, useSelectedPackage } from "~/stores";
import { Uint8ArrayToString, stringToUint8Array } from "~/utils/convert";
import { colors } from "#root/tailwind.config";

async function getFontData(weight: number) {
  return await fetch(
    `https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-${weight}-normal.woff`
  ).then((res) => res.arrayBuffer());
}

export default function useGenerateImg() {
  const [initialized, setInitialized] = useState(false);
  const setPackage = useAppStore(({ config }) => config.setPackage);
  const selectedPackage = useSelectedPackage();
  const width = 1200;
  const height = 775;

  async function init() {
    if (initialized) return;
    setInitialized(true);

    const yoga = await initYoga(
      await fetch("/wasm/yoga.wasm").then((res) => res.arrayBuffer())
    );
    initSatori(yoga);
    await resvg.initWasm(fetch("/wasm/resvg.wasm"));
  }

  async function generate(props: StaticShareImageProps) {
    const { shareImageData } = selectedPackage;
    let pngBuffer = shareImageData
      ? stringToUint8Array(shareImageData)
      : undefined;

    if (!pngBuffer) {
      const fonts = (await Promise.all(
        [400, 500, 600, 700].map(async (weight) => ({
          name: "Rubik Latin",
          data: await getFontData(weight),
          weight,
          style: "normal",
        }))
      )) as Font[];

      const svg = await satori(<StaticShareImage {...props} />, {
        width,
        height,
        fonts,
        tailwindConfig: {
          theme: {
            colors,
          },
        },
      });

      const resvgJS = new resvg.Resvg(svg, {
        fitTo: {
          mode: "width",
          value: width,
        },
        dpi: 2,
        shapeRendering: 2,
        textRendering: 2,
        imageRendering: 1,
      });
      pngBuffer = resvgJS.render().asPng();

      setPackage(selectedPackage.id, {
        shareImageData: Uint8ArrayToString(pngBuffer),
      });
    }

    const file = new File([pngBuffer], "image.png", { type: "image/png" });
    const svgURL = URL.createObjectURL(
      new Blob([pngBuffer], { type: "image/png" })
    );
    return { svgURL, file };
  }

  return { init, generate, initialized, width, height };
}
