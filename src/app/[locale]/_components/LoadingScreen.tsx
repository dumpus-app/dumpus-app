"use client";

import useLoading from "~/hooks/use-loading";

export default function LoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const loading = useLoading();

  if (loading)
    return (
      <div className="my-auto flex flex-col items-center space-y-4">
        <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
        <div className="max-w-xs text-center">
          <h1 className="text-xl font-bold text-white">Loading...</h1>
          <p className="mt-2 text-gray-400">Please wait.</p>
        </div>
      </div>
    );

  return <>{children}</>;
}
