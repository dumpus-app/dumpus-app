"use client";

import { colors } from "#root/tailwind.config";
import * as resvg from "@resvg/resvg-wasm";
import { useCallback, useState } from "react";
import { useMount } from "react-use";
import satori, { Font, init as initSatori } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import StaticShareImage, {
  type Props as StaticShareImageProps,
} from "~/components/StaticShareImage";

async function getFontData(weight: number) {
  return await fetch(
    `https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-${weight}-normal.woff`
  ).then((res) => res.arrayBuffer());
}

export default function useGenerateImg({
  afterInit,
}: {
  afterInit: (
    generate: (props: StaticShareImageProps) => Promise<{
      svgURL: string;
      file: File;
    }>
  ) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "initialized">(
    "idle"
  );
  const [generating, setGenerating] = useState(false);
  const width = 1200;
  const height = 775;

  const generate = useCallback(async function (props: StaticShareImageProps) {
    setGenerating(true);
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
    const pngBuffer = resvgJS.render().asPng();

    const file = new File([pngBuffer], "image.png", { type: "image/png" });
    const svgURL = URL.createObjectURL(
      new Blob([pngBuffer], { type: "image/png" })
    );
    setGenerating(false);
    return { svgURL, file };
  }, []);

  async function init() {
    if (status !== "idle") return;
    setStatus("loading");

    const yoga = await initYoga(
      await fetch("/wasm/yoga.wasm").then((res) => res.arrayBuffer())
    );
    initSatori(yoga);
    await resvg.initWasm(fetch("/wasm/resvg.wasm"));
    setStatus("initialized");
    afterInit(generate);
  }

  useMount(async () => await init());

  return {
    init,
    generate,
    initialized: status === "initialized",
    width,
    height,
    generating,
  };
}
