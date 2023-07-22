import { SLIDES } from "./_data/slides";

export function generateStaticParams() {
  return SLIDES.map((_, i) => ({
    slide: (i + 1).toString(),
  }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
