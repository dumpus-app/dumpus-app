import BottomNav from "../_components/BottomNav";
import Share from "./_components/Share";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav>
        <Share />
      </BottomNav>
    </>
  );
}
