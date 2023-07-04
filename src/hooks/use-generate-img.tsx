"use client";

import satori, { init as initSatori } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import * as resvg from "@resvg/resvg-wasm";
import { useState } from "react";

export default function useGenerateImg() {
  const [initialized, setInitialized] = useState(false);

  async function init() {
    if (initialized) return;
    setInitialized(true);

    const yoga = await initYoga(
      await fetch("/wasm/yoga.wasm").then((res) => res.arrayBuffer())
    );
    initSatori(yoga);
    await resvg.initWasm(fetch("/wasm/resvg.wasm"));
  }

  async function generate() {
    const html = (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <svg
          width="75"
          viewBox="0 0 75 65"
          fill="#000"
          style={{ margin: "0 75px" }}
        >
          <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
        </svg>
        <div style={{ marginTop: 40 }}>Hello, World</div>
      </div>
    );

    const fontFile = await fetch(
      "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff"
    );
    const fontData: ArrayBuffer = await fontFile.arrayBuffer();

    const width = 1200;
    const svg = await satori(html, {
      width,
      height: 627,
      fonts: [
        {
          name: "Inter Latin",
          data: fontData,
          style: "normal",
        },
      ],
    });

    const resvgJS = new resvg.Resvg(svg, {
      fitTo: {
        mode: "width",
        value: width,
      },
    });
    const pngData = resvgJS.render(); // Output PNG data, Uint8Array
    const pngBuffer = pngData.asPng();

    const file = new File([pngBuffer], "image.png", { type: "image/png" });
    const svgURL = URL.createObjectURL(
      new Blob([pngBuffer], { type: "image/png" })
    );
    return { svgURL, file };
  }

  return { init, generate, initialized };
}
