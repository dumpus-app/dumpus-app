import PageHeader from "./_components/PageHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader />
      {children}
    </>
  );
}
