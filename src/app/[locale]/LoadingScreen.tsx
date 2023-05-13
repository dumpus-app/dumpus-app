"use client";

import useLoading from "~/hooks/use-loading";

export default function LoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const loading = useLoading();

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
