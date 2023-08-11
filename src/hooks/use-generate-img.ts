"use client";

// import { colors } from "#root/tailwind.config";
// import * as resvg from "@resvg/resvg-wasm";
import { useCallback, useState } from "react";
import { useMount } from "react-use";
// import satori, { type Font } from "satori";
// import { create } from "zustand";
// import { shallow } from "zustand/shallow";
import StaticShareImage, {
  type Props as StaticShareImageProps,
} from "~/components/StaticShareImage";
import html2canvas from "html2canvas";
import { renderToString } from "react-dom/server";

// async function getFontData(weight: number) {
//   return await fetch(
//     `https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-${weight}-normal.woff`,
//   ).then((res) => res.arrayBuffer());
// }

// const useStore = create<{
//   _init: boolean;
//   setInit: (v: boolean) => void;
// }>((set) => ({
//   _init: false,
//   setInit: (v) => set({ _init: v }),
// }));

export default function useGenerateImg() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "initialized" | "error"
  >("idle");
  // const [_init, setInit] = useStore(
  //   (state) => [state._init, state.setInit],
  //   shallow,
  // );

  const width = 1200;
  const height = 775;

  async function init() {
    // if (status !== "idle") return;
    setStatus("loading");

    try {
      // if (!_init) {
      //   await resvg.initWasm(fetch("/wasm/resvg.wasm"));
      //   setInit(true);
      // }
      setStatus("initialized");
    } catch (err) {
      setStatus("error");
    }
  }

  useMount(async () => await init());

  const generate = useCallback(async function (props: StaticShareImageProps) {
    // const fonts = (await Promise.all(
    //   [400, 500, 600, 700].map(async (weight) => ({
    //     name: "Rubik Latin",
    //     data: await getFontData(weight),
    //     weight,
    //     style: "normal",
    //   })),
    // )) as Font[];

    const element = document.createElement("div");
    element.innerHTML = renderToString(StaticShareImage(props));
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.position = "fixed";
    element.style.top = "100%";
    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      // Required for images, altogether with crossOrigin="anonymous"
      useCORS: true,
    });
    const url = canvas.toDataURL("image/png", 1.0);
    document.body.removeChild(element);

    const blob = await fetch(url).then((res) => res.blob());

    // const svg = await satori(StaticShareImage(props), {
    //   width,
    //   height,
    //   fonts,
    //   tailwindConfig: {
    //     theme: {
    //       colors,
    //     },
    //   },
    // });

    // const resvgJS = new resvg.Resvg(svg, {
    //   fitTo: {
    //     mode: "width",
    //     value: width,
    //   },
    //   dpi: 2,
    //   shapeRendering: 2,
    //   textRendering: 2,
    //   imageRendering: 1,
    // });
    // const pngBuffer = resvgJS.render().asPng();

    const webFile = new File([blob], "image.png", {
      type: "image/png",
    });

    // const blob = new Blob([pngBuffer], { type: "image/png" });

    // async function base64FromBlob(blob: Blob): Promise<string> {
    //   return new Promise((resolve, reject) => {
    //     const reader = new FileReader();
    //     reader.onerror = reject;
    //     reader.onload = () => {
    //       if (typeof reader.result === "string") {
    //         resolve(reader.result);
    //       } else {
    //         reject("method did not return a string");
    //       }
    //     };
    //     reader.readAsDataURL(blob);
    //   });
    // }

    // const url = await base64FromBlob(blob);

    return { webFile, url };
  }, []);

  return {
    init,
    generate,
    status,
    width,
    height,
  };
}
