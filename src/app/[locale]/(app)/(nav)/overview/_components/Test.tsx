"use client";

import { useState } from "react";
import { useMount } from "react-use";
import useGenerateImg from "~/hooks/use-generate-img";
import Image from "next/image";

export default function Test() {
  const { init, generate, initialized } = useGenerateImg();
  const [url, setUrl] = useState<string>();
  const [file, setFile] = useState<File>();

  useMount(() => init());

  async function gen() {
    const { svgURL, file } = await generate();
    setUrl(svgURL);
    setFile(file);
  }

  return (
    <div>
      <div>GENERATE</div>
      <button onClick={() => gen()}>
        {initialized ? "Generate" : "Initializing..."}
      </button>
      <div className="relative aspect-[1200/627] h-48">
        <Image
          src={url || ""}
          alt={``}
          fill
          className="bg-brand-300 object-cover object-center"
        />
      </div>
      {url && file && (
        <button
          onClick={() => {
            navigator.share({
              text: "This is a test!",
              title: "Dumpus",
              url: window.location.href,
              files: [file],
            });
          }}
        >
          share
        </button>
      )}
    </div>
  );
}
