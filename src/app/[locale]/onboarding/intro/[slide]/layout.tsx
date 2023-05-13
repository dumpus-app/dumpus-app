import { PageProps } from "~/types";

export async function generateStaticParams() {
  return [1, 2, 3].map((slide) => ({ slide: slide.toString() }));
}

export default function RootLayout({
  children,
  params: { locale },
}: PageProps<
  {},
  {
    children: React.ReactNode;
  }
>) {
  return <div>{children}</div>;
}
