"use client";

import i18next from "i18next";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSQL from "~/hooks/use-sql";
import { configAtom } from "~/stores";

export default function LoadingScreen({
  children,
  data: { title, description },
}: {
  children: React.ReactNode;
  data: { title: string; description: string };
}) {
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const pathname = usePathname() || "/";
  const router = useRouter();

  const [config, setConfig] = useAtom(configAtom);
  const { init } = useSQL();

  const redirectPath = `/${i18next.language}/onboarding/`;

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setConfig(config);
    if (config.db.selectedId) {
      init({ id: config.db.selectedId }).then(() => {
        setLoading(false);
      });
    } else if (!pathname.startsWith(redirectPath)) {
      router.replace(redirectPath);
      setShouldRedirect(true);
    } else {
      setLoading(false);
    }
  }, [config, init, pathname, redirectPath, router, setConfig]);

  useEffect(() => {
    if (loading && shouldRedirect && pathname === redirectPath) {
      setLoading(false);
    }
  }, [loading, pathname, redirectPath, router, shouldRedirect]);

  if (loading)
    return (
      <div className="my-auto flex flex-col items-center space-y-4">
        <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-gray-400">{description}</p>
        </div>
      </div>
    );

  return <>{children}</>;
}
