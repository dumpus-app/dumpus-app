import { PageProps } from "~/types";
import Footer from "../../_components/Footer";
import Header from "../../_components/Header";

export async function generateStaticParams() {
  return [1, 2, 3].map((slide) => ({ slide: slide.toString() }));
}

export default function RootLayout({
  children,
  params: { locale, slide },
}: PageProps<
  { slide: "1" | "2" | "3" },
  {
    children: React.ReactNode;
  }
>) {
  const header = {
    "1": { href: "/onboarding", progress: 0 as const },
    "2": { href: "/onboarding/intro/1", progress: 0.33 as const },
    "3": { href: "/onboarding/intro/2", progress: 0.66 as const },
  }[slide];
  const footer = {
    "1": { href: "/onboarding/intro/2", label: "Awesome!" },
    "2": { href: "/onboarding/intro/3", label: "I feel better now!" },
    "3": { href: "/onboarding/setup", label: "Can't wait!" },
  }[slide];

  return (
    <>
      <Header {...header} />
      {children}
      <Footer {...footer} />
    </>
  );
}
