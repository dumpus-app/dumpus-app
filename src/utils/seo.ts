import type { Metadata } from "next";
import { BASE_URL, SITE_NAME } from "~/constants";

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
    colorScheme: "dark",
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
  };
}
