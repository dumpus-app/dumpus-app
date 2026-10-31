import { colors } from "#root/tailwind.config";
import type { Metadata, Viewport } from "next";
import { BASE_URL, SITE_NAME } from "~/constants";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  colorScheme: "dark",
};

export function generateSEO({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  const ogImage = `${BASE_URL}/assets/og.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      url: BASE_URL,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SITE_NAME,
      creator: "@dumpus",
      images: ogImage,
    },
    other: {
      // Should be an empty string but Next doesn't let
      // us do such thing
      "darkreader-lock": "_",
      "theme-color": colors.gray[950],
    },
  };
}
