"use client";

import html2canvas from "html2canvas";
import { useCallback } from "react";
import { renderToString } from "react-dom/server";
import StaticShareImage, {
  type Props as StaticShareImageProps,
} from "~/components/StaticShareImage";

const width = 1200;
const height = 775;

export default function useGenerateImg() {
  const generate = useCallback(async function (props: StaticShareImageProps) {
    // Create element with Static Share Card
    const element = document.createElement("div");
    element.innerHTML = renderToString(StaticShareImage(props));
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    // Make sure it doesn't show on the page
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
    const webFile = new File([blob], "image.png", {
      type: "image/png",
    });

    return { webFile, url };
  }, []);

  return {
    generate,
    width,
    height,
  };
}
