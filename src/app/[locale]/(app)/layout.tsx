import EnsureSelectedPackage from "./_components/EnsureSelectedPackage";
import ExitDemoBanner from "./_components/ExitDemoBanner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EnsureSelectedPackage>
      <>
        <ExitDemoBanner />
        {children}
      </>
    </EnsureSelectedPackage>
  );
}
