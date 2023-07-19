"use client";

import i18next from "i18next";
import Image from "next/image";
import { useState } from "react";
import ImageZoom from "~/components/ImageZoom";
import { fallbackLocale } from "~/i18n/settings";

const PREFIX = "/assets/onboarding/";

export default function StepImage({
  src: initialSrc,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [src, setSrc] = useState(initialSrc);

  return (
    <div className="relative aspect-video w-full">
      <ImageZoom>
        {/* TODO: extract to check if valid */}
        <Image
          src={src}
          alt={alt}
          onError={() => {
            setSrc((src) =>
              src.replace(PREFIX + i18next.language, PREFIX + fallbackLocale)
            );
          }}
          fill
          className="rounded-lg border-2 border-gray-700 bg-brand-950 object-cover object-center"
        />
      </ImageZoom>
    </div>
  );
}
