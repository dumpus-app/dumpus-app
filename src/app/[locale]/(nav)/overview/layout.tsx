import BottomNav from "../_components/BottomNav";
import TopNav from "../_components/TopNav";
import Share from "./_components/Share";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
      <BottomNav>
        <Share />
      </BottomNav>
    </>
  );
}
