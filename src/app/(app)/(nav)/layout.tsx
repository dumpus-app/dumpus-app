import BottomNav from "./_components/BottomNav";
import TopNav from "./_components/TopNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
      <BottomNav />
    </>
  );
}
