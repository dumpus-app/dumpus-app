"use client";

import Script from "next/script";

export default function Scripts() {
  return (
    <>
      {process.env.NODE_ENV === "production" &&
        process.env.NEXT_PUBLIC_DEPLOY_ENV === "web" && (
          <Script
            async
            defer
            src={process.env.NEXT_PUBLIC_ANALYTICS_SRC}
            data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID}
          />
        )}
    </>
  );
}
