"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Redirect } from "~/i18n/redirect";

// export default Redirect;

export default function Index() {
  const pathname = usePathname();

  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  // return <Redirect />;
  return null;
}
