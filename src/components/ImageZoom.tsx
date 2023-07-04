"use client";

import Zoom from "react-medium-image-zoom";

export default function ImageZoom({ children }: { children: React.ReactNode }) {
  return (
    <Zoom
    // TODO: load from i18n
    //   a11yNameButtonUnzoom={}
    //   a11yNameButtonZoom={}
    >
      {children}
    </Zoom>
  );
}
