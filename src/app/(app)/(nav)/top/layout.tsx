import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";

export default function Layout({
  children,
}: PageProps<{}, { children: React.ReactNode }>) {
  return (
    <>
      <PageHeader />
      {children}
    </>
  );
}
